# aimai-db
My dashboard application for trading bot.

## Server

### Setup

```
$ cd server
$ vi setup.py
$ cat setup.py
import os

if 'AIMAI_JWT_SECRET_KEY' not in os.environ:
  os.environ['AIMAI_JWT_SECRET_KEY'] = '343d6c92ae95c5dd01a5355f9a4a865d'
```

### Start

```
$ python3 start.py -C userName
```

## Client

### Build

```
$ cd client
$ npm init
$ webpack --mode production
```
