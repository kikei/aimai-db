import datetime
import logging
import os
import pymongo
import sys
import json
import flask

# https://pythonhosted.org/Flask-JWT/
import flask_jwt_extended as flask_jwt

from DashboardModels import DashboardModels, Account

CWD = os.path.dirname(os.path.abspath(__file__))

DIR_LIBS = os.path.join(CWD, '..', '..', 'libs')
sys.path.append(os.path.join(DIR_LIBS, 'btcbot1', 'apps', 'trade', 'src'))

from main import getDBInstance, getModels
from classes import Confidence, TrendStrength, Position, strToDatetime

dbi = getDBInstance()
dashbModels = DashboardModels(dbi)
btctaiModels = getModels(dbi)

modelAccounts = dashbModels.Accounts
modelValues = btctaiModels.Values
modelConfidences = btctaiModels.Confidences
modelTrendStrengths = btctaiModels.TrendStrengths
modelTrades = btctaiModels.Trades
modelPositions = btctaiModels.Positions
modelTicks = btctaiModels.Ticks

# markets = Markets()

app = flask.Flask(__name__)
if 'AIMAI_JWT_SECRET_KEY' not in os.environ:
  print('''Required environment variables not defined.

export AIMAI_JWT_SECRET_KEY="Your_Secret_Key"
''')
  exit()

app.config['JWT_SECRET_KEY'] = os.environ['AIMAI_JWT_SECRET_KEY']
app.config['JWT_EXPIRATION_DELTA'] = datetime.timedelta(days=14)

jwt = flask_jwt.JWTManager(app)

@jwt.user_claims_loader
def makeJWTClaims(account):
  obj = account.toDict()
  return {'username': obj['username']}

@jwt.user_identity_loader
def userIdentityLoader(account):
  obj = account.toDict()
  return obj['_id']

#jwt.payload_handler = makeJWTPayload

@app.route('/refresh', methods=['POST'])
@flask_jwt.jwt_refresh_token_required
def refresh():
  identity = flask_jwt.get_jwt_identity()
  account = modelAccounts.one(accountId=identity)
  accessToken = flask_jwt.create_access_token(identity=account)
  return flask.jsonify({'access_token': accessToken})

@app.route('/account/<string:accountId>/info', methods=['GET'])
@flask_jwt.jwt_required
def getAccount(accountId):
  identity = flask_jwt.get_jwt_identity()
  if accountId != identity:
    flask.abort(403)
  obj = modelAccounts.one(accountId).toDict()
  account = {
    'userid': obj['_id'],
    'username': obj['username']
  }
  return flask.jsonify(account)

@app.route('/ticks', methods=['GET'])
@flask_jwt.jwt_required
def getTicks():
  exchangers = flask.request.args.get('exchangers', None)
  start = flask.request.args.get('start', None)
  end = flask.request.args.get('end', None)
  limit = flask.request.args.get('limit', None)
  order = flask.request.args.get('order', -1)
  try:
    if exchangers is not None:
      exchangers = exchangers.split(',')
    if start is not None:
      start = float(start)
    if end is not None:
      end = float(end)
    if limit is not None:
      limit = int(limit)
    if order is not None:
      order = int(order)
  except ValueError as e:
    flask.abort(400)
  ticks = modelTicks.all(exchangers=exchangers,
                         start=start, end=end, limit=limit, order=order)
  ticks = {e: [t.toDict() for t in ticks[e]] for e in ticks}
  return json.dumps({'ticks': ticks})

@app.route('/btctai/<string:accountId>/values', methods=['GET'])
@flask_jwt.jwt_required
def getBtctaiValues(accountId):
  identity = flask_jwt.get_jwt_identity()
  if accountId != identity:
    flask.abort(403)
  values = modelValues.all(accountId=accountId)
  return flask.jsonify(values)

@app.route('/btctai/<string:accountId>/values/<string:key>',
           methods=['POST', 'PATCH'])
@flask_jwt.jwt_required
def post_flag(accountId, key):
  identity = flask_jwt.get_jwt_identity()
  if accountId != identity:
    flask.abort(403)
  obj = flask.request.get_json()
  value = obj['value']
  if not modelValues.checkType(key, value):
    flask.abort(400)
  try:
    result = modelValues.set(key, value, accountId=accountId)
    if result is None:
      flask.abort(404)
    ty = modelValues.getType(key)
    return flask.jsonify({key: (result, ty)})
  except KeyError as e:
    print(e)
    flask.abort(404)
    
@app.route('/btctai/<string:accountId>/trades', methods=['GET'])
@flask_jwt.jwt_required
def getBtctaiTrades(accountId):
  identity = flask_jwt.get_jwt_identity()
  if accountId != identity:
    flask.abort(403)
  count = flask.request.args.get('count', None)
  before = flask.request.args.get('before', None)
  try:
    if count is not None:
      count = int(count)
    if before is not None:
      before = float(before)
  except ValueError as e:
    flask.abort(400)
  trades = modelTrades.all(accountId=identity, before=before, count=count)
  trades = [t.toDict() for t in trades]
  return flask.jsonify(trades)

@app.route('/btctai/<string:accountId>/positions', methods=['GET'])
@flask_jwt.jwt_required
def getBtctaiPositions(accountId):
  identity = flask_jwt.get_jwt_identity()
  if accountId != identity:
    flask.abort(403)
  count = flask.request.args.get('count', None)
  before = flask.request.args.get('before', None)
  try:
    if count is not None:
      count = int(count)
    if before is not None:
      before = float(before)
  except ValueError as e:
    flask.abort(400)
  trades = modelPositions.all(accountId=identity, before=before, count=count)
  trades = [t.toDict() for t in trades]
  return flask.jsonify(trades)

@app.route('/btctai/<string:accountId>/positions/<string:timestamp>',
           methods=['POST'])
@flask_jwt.jwt_required
def postBtctaiPositions(accountId, timestamp):
  identity = flask_jwt.get_jwt_identity()
  if accountId != identity:
    flask.abort(403)
  obj = flask.request.get_json()
  position = modelPositions.one(accountId, timestamp=float(timestamp))
  position = position.toDict()
  obj = {**position, **obj}
  position = Position.fromDict(obj)
  position = modelPositions.save(position, accountId=accountId)
  obj = position.toDict()
  return flask.jsonify(obj)

@app.route('/btctai/<string:accountId>/confidences', methods=['GET'])
@flask_jwt.jwt_required
def getBtctaiConfidences(accountId):
  identity = flask_jwt.get_jwt_identity()
  if accountId != identity:
    flask.abort(403)
  count = flask.request.args.get('count', None)
  before = flask.request.args.get('before', None)
  try:
    if count is not None:
      count = int(count)
    if before is not None:
      before = float(before)
  except ValueError as e:
    flask.abort(400)
  confs = modelConfidences.all(accountId=accountId, before=before, count=count)
  confs = [c.toDict() for c in confs]
  return flask.jsonify(confs)

@app.route('/btctai/<string:accountId>/confidences', methods=['PUT'])
@flask_jwt.jwt_required
def putBtctaiConfidences(accountId):
  identity = flask_jwt.get_jwt_identity()
  if accountId != identity:
    flask.abort(403)
  obj = flask.request.get_json()
  conf = Confidence.fromDict(obj)
  conf = modelConfidences.save(conf, accountId=accountId)
  conf = conf.toDict()
  return flask.jsonify(conf)

@app.route('/btctai/<string:accountId>/trendStrength', methods=['GET'])
@flask_jwt.jwt_required
def getBtctaiTrendStrength(accountId):
  identity = flask_jwt.get_jwt_identity()
  if accountId != identity:
    flask.abort(403)
  count = flask.request.args.get('count', None)
  before = flask.request.args.get('before', None)
  try:
    if count is not None:
      count = int(count)
    if before is not None:
      before = float(before)
  except ValueError as e:
    flask.abort(400)
  values = modelTrendStrengths.all(accountId=accountId,
                                  before=before, count=count)
  values = [v.toDict() for v in values]
  return flask.jsonify(values)

@app.route('/btctai/<string:accountId>/trendStrength', methods=['PUT'])
@flask_jwt.jwt_required
def putBtctaiTrendStrength(accountId):
  identity = flask_jwt.get_jwt_identity()
  if accountId != identity:
    flask.abort(403)
  obj = flask.request.get_json()
  values = TrendStrength.fromDict(obj)
  values = modelTrendStrengths.save(values, accountId=accountId)
  values = values.toDict()
  return flask.jsonify(values)

# @app.route('/api/assets', methods=['GET'])
# @jwt_required()
# def get_assets():
#     bf = markets.BitFlyer
#     qn = markets.Quoine

#     bf_net_asset = bf.get_net_asset()
#     qn_net_asset = qn.get_net_asset()

#     total_net_asset = bf_net_asset + qn_net_asset

#     assets = {
#         'exchangers': {
#             'bitflyer': {
#                 'net_asset': bf_net_asset
#             },
#             'quoine': {
#                 'net_asset': qn_net_asset
#             }
#         },
#         'total': {
#             'net_asset': total_net_asset
#         }
#     }
#     return flask.jsonify(assets)

# @app.route('/api/conditions', methods=['GET'])
# #@jwt_required()
# def get_conditions():
#     conditions = models.Conditions.all()
#     conditions = [a.to_dict() for a in conditions]
#     return flask.jsonify({ 'conditions': conditions })

# @app.route('/api/conditions', methods=['POST'])
# @jwt_required()
# def post_conditions():
#     inputed = json.loads(flask.request.data.decode())
#     condition = {
#       'diff': int(inputed['diff']),
#       'lot': float(inputed['lot']),
#       'goal': float(inputed['goal']),
#       'type': inputed['type']
#     }
#     result = models.Conditions.set(condition['diff'], condition['lot'],
#                                    condition['goal'], condition['type'])
#     return flask.jsonify({ 'condition': condition })

# @app.route('/api/conditions/<int:diff>', methods=['DELETE'])
# @jwt_required()
# def delete_condition(diff):
#     result = models.Conditions.delete(diff)
#     return flask.jsonify({ 'diff': diff })

# @app.route('/api/ticks', methods=['GET'])
# @jwt_required()
# def get_ticks():
#     ticks = models.Ticks.one()
#     ticks = ticks.to_dict()
#     return flask.jsonify({ 'exchangers': ticks })

# @app.route('/api/positions', methods=['GET'])
# @jwt_required()
# def get_positions():
#     positions = models.Positions.all()
#     ticks = models.Ticks.one()
#     def profit(p):
#       return Profit.calculate(ticks, p).corrected
#     result = [{**(p.to_dict()), 'pnl': profit(p)} for p in positions]
#     return flask.jsonify({ 'positions': result })

# @app.route('/api/exchangers/quoine', methods=['GET'])
# @jwt_required()
# def get_quoine():
#     positions = models.Positions.all()
#     ticks = models.Ticks.one()
    
#     quoine = markets.Quoine
#     account = quoine.get_account()

#     trades = quoine.get_trades(limit=1000, status='open')

#     # trade id list
#     managed_positions = set()

#     # build managed_positions
#     for position in positions:
#       qpos = position.get_one(Tick.Quoine)
#       if qpos is None:
#         managed_positions = set()
#       else:
#         managed_positions |= set(qpos.ids)

#     # True managed means the trade is under management of applications.
#     # Trades with False managed need to be closed manually.
#     for trade in trades:
#         trade['managed'] = trade['id'] in managed_positions

#     return flask.jsonify({
#         'net_asset': account['equity'],
#         'free_margin': account['free_margin'],
#         'required_margin': account['margin'],
#         'keep_rate': account['keep_rate'],
#         'tick': ticks.exchanger(Tick.Quoine).to_dict(),
#         'positions': trades
#     })


@app.route('/')
def root():
  return flask.redirect('/index.html', code=302)

@app.route('/index.html')
@flask_jwt.jwt_optional
def getIndex():
  accountId = flask_jwt.get_jwt_identity()
  title = "aimai dashboard"
  return flask.render_template('index.html',
                               title=title)


# @app.route('/login', methods=['GET'])
# def getLogin():
#   title = "BitcoinArb Dashboard"
#   return flask.render_template('login.html',
#                                title=title)

@app.route('/login', methods=['POST'])
def postLogin():
  obj = flask.request.get_json()
  username = obj['username']
  password = obj['password']
  if username is None:
    flask.abort(400)
  if password is None:
    flask.abort(400)
  account = modelAccounts.authenticate(username, password)
  if account is None:
    flask.abort(401)
  obj = account.toDict()
  accessToken = flask_jwt.create_access_token(identity=account)
  refreshToken = flask_jwt.create_refresh_token(identity=account)
  tokens = {
    'access_token': accessToken,
    'refresh_token': refreshToken
  }
  return flask.jsonify(tokens)
    
  title = "BitcoinArb Dashboard"
  return flask.render_template('login.html',
                               title=title)

@app.route('/<path:path>')
def fallback(path):
  return getIndex()

# /post にアクセスしたときの処理
# @app.route('/post', methods=['GET', 'POST'])
# def post():
#     title = "こんにちは"
#     if flask.request.method == 'POST':
#         # リクエストフォームから「名前」を取得して
#         name = flask.request.form['name']
#         # index.html をレンダリングする
#         return flask.render_template('index.html',
#                                      name=name, title=title)
#     else:
#         # エラーなどでリダイレクトしたい場合はこんな感じで
#         return flask.redirect(flask.url_for('index'))


def requestUserSetting():
    msg = """
You need to setup user at first.
Run following command:

    {script} -C USERNAME
"""
    print(msg.format(script=__file__).strip())

def getOptions(args):
    import getopt
    options = {
      'mode': 'main',
      'port': None
    }
    try:
        opts, args = getopt.getopt(args,
                                   'hC:P:p:',
                                   ['help',
                                    'create',
                                    'password=',
                                    'port='])
    except getopt.GetoptError:
        return options
    for opt, arg in opts:
        if opt in ('-h', '--help'):
           options['mode'] = 'help'
        elif opt in ('-C', '--create'):
           options['mode'] = 'add_user'
           options['username'] = arg
        elif opt in ('-P', '--password'):
           options['password'] = arg
        elif opt in ('-p', '--port'):
           options['port'] = arg
    return options

def runMain(port=None):
  accounts = modelAccounts.all()
  if len(list(accounts)) == 0:
    requestUserSetting()
    exit()
  #app.debug = True # デバッグモード有効化
  app.run(host='0.0.0.0', port=port)

def runAddUser(username, password=None):
  import getpass
  while password is None or password == '':
    password = getpass.getpass('Login password: ')
  account = modelAccounts.oneByUsername(username)
  if account is not None:
    print('User already exists, user={user}.'.format(user=username))
  else:
    account = Account.create(username, password)
    modelAccounts.save(account)
    print('Succefully created, user={user}.'.format(user=username))

def print_help():
    msg = """Usage: {script} [Options]...

Options:
    -C, --create         Create login user.
    -p, --port           Port to LISTEN (default 5000).
    -h, --help           Show this help.
"""
    print(msg.format(script=sys.argv[0]))

if __name__ == '__main__':
    options = getOptions(sys.argv[1:])
    if options['mode'] == 'main':
        runMain(port=options['port'])
    elif options['mode'] == 'add_user':
        runAddUser(options['username'], options['password'])
    else:
        print_help()
    
