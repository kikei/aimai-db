import sys, os
import logging

logging.basicConfig(stream=sys.stderr)

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# You can define enviroments in setup.py.
try:
  import setup
except ImportError as e: pass

from start import app as application
