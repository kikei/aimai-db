import hashlib
from bson.objectid import ObjectId

class DashboardModels(object):
    def __init__(self, dbs):
      aimai_db = dbs.aimai_db
      self.Accounts = Accounts(aimai_db)


class Account(object):
  def __init__(self, accountId, username, hashedPassword):
    self.accountId = accountId
    self.username = username
    self.hashedPassword = hashedPassword

  @staticmethod
  def create(username, password):
    if username is None or len(username) < 5:
      raise ValueError('invalid username, value={v}'.format(v=username))
    if password is None or len(password) < 5:
      raise ValueError('invalid username, value={v}'.format(v=password))
    hashedPassword = Account.hashPassword(password)
    return Account(None, username, hashedPassword)

  def validate(self, username, password):
    return all([self.username == username,
                self.hashedPassword == Account.hashPassword(password)])
  
  def toDict(self):
    if self.accountId is None:
      obj = {
        'username': self.username,
        'password': self.hashedPassword
      }
    else:
      obj = {
        '_id': str(self.accountId),
        'username': self.username,
        'password': self.hashedPassword
      }
    return obj
  
  @staticmethod
  def fromDict(obj):
    if obj is None:
      return None
    accountId = obj['_id']
    username = obj['username']
    hashedPassword = obj['password']
    return Account(accountId, username, hashedPassword)
  
  @staticmethod
  def hashPassword(password):
    return hashlib.sha512(password.encode('utf-8')).hexdigest()


class SameUsernameError(ValueError): pass

class Accounts(object):
  def __init__(self, db):
    self.collection = db.accounts
    self.setup()

  def setup(self):
    self.collection.create_index('username')

  def save(self, account):
    obj = account.toDict()
    if account.accountId is None:
      obj = account.toDict()
      exists = self.oneByUsername(obj['username'])
      if exists is not None:
        raise SameUsernameError(obj['username'])
      result = self.collection.insert_one(obj)
      account.accountId = result.inserted_id
    else:
      condition = {'_id': obj['_id']}
      result = self.collection.replace_one(condition, obj, upsert=False)
      if result.matched_count == 0:
        account = None
    return account
  
  def one(self, accountId):
    if not isinstance(accountId, ObjectId):
      accountId = ObjectId(accountId)
    condition = {'_id': accountId}
    account = self.collection.find_one(condition)
    if account is None:
      return None
    else:
      return Account.fromDict(account)

  def all(self):
    accounts = self.collection.find()
    accounts = (Account.fromDict(account) for account in accounts)
    return accounts

  def oneByUsername(self, username):
    account = self.collection.find_one({'username': username})
    if account is None:
      return None
    return Account.fromDict(account)

  def authenticate(self, username, password):
    account = self.oneByUsername(username)
    if account is not None and \
       account.validate(username, password):
      return account
    else:
      return None
    
    
