import webapp2
import cgi
import re
import logging
import os
import time
import jinja2
import hashlib
import hmac
import string
import random
import urllib2
import json
from xml.dom import minidom
from google.appengine.ext import db
from google.appengine.api import memcache

template_dir = os.path.join(os.path.dirname(__file__), 'templates')
jinja_env = jinja2.Environment(loader = jinja2.FileSystemLoader(template_dir),
                               autoescape = True)

test_vid = "M7lc1UVf-VE"

event_list = ["play", "pause", "seek", "seek_play", "keep_alive"]

class Event(db.Model):
  vid = db.StringProperty(required = True)
  event = db.StringProperty(required = True)
  timestamp = db.IntegerProperty(required = True)
  playtime = db.FloatProperty(required = True)

def random_string(len):
  return ''.join([random.choice(string.letters) for i in range(len)])

class BaseHandler(webapp2.RequestHandler):
  EVENT_LOG_DIR = "event_log/"

  def set_cookie(self, key, value, path = '/'):
    self.response.headers.add_header('Set-Cookie',
        '%s=%s; Path=%s' % (key, value, path))
        
  def get_cookie(self, key):
    value = self.request.cookies.get(key)
    if not value:
      return None
    else:
      return value
      
  def clear_cookie(self, key, path = '/'):
    self.response.headers.add_header('Set-Cookie', '%s=; Path=%s' % (key, path))

  def initialize(self, *a, **kw):
    webapp2.RequestHandler.initialize(self, *a, **kw)
    self.id = self.get_cookie('id')

  def render_str(self, template, **params):
    t = jinja_env.get_template(template)
    return t.render(params)

  def render(self, template, **kw):
    self.response.out.write(self.render_str(template, **kw))

  def write(self, *a, **kw):
    self.response.out.write(*a, **kw)

class MainPageHandler(BaseHandler):
  def get(self):
    self.render("main.html")

class MasterHandler(BaseHandler):
  def get(self):
    vid = self.request.get("vid")
    if not vid:
      self.response.headers['Content-Type'] = 'text/plain'
      self.response.write("video id is required.")
      return
    id = random_string(20)
    self.set_cookie("id", id)
    self.render("master.html", vid=vid, share_link = "http://collab-video-xiaolong.appspot.com/slave?id=%s&vid=%s" % (id, vid))

  def post(self):
    event = self.request.get("event")
    timestamp = self.request.get("timestamp")
    playtime = self.request.get("playtime")
    if (self.id):
      if (event and timestamp and playtime):
        logging.error("recieved event: %s, %s, %s" % (event, timestamp, playtime))
        Event(vid = self.id, event = event, timestamp = int(timestamp), playtime = float(playtime)).put()
      else:
        logging.error("missing event attribute")
    else :
      logging.error("error: master event post without id")

class SlaveHandler(BaseHandler):
  def get(self):
    self.id = self.request.get("id")
    vid = self.request.get("vid")
    if (not self.id or not vid):
      logging.error("slave get request without id or vid")
      self.write("IDs required to view synchronized video")
      return
    self.render("slave.html", id = self.id, vid = vid)

  def post(self):
    last_timestamp = self.request.get("last_timestamp")
    self.id = self.request.get("id")
    logging.error("arguments are %s" % self.request.arguments())
    if (not self.id):
      logging.error("error: master event post without id")
      self.abort(400)
      return
    if (not last_timestamp):
      last_timestamp = 0

    logging.error("vid is %s, last_timestamp is %s" % (self.id, last_timestamp))

    new_event = Event.gql("WHERE vid = :1 ORDER BY timestamp DESC",
        self.id).get()
    if new_event and new_event.timestamp != long(last_timestamp):
      json_obj = {
        'has_update': True,
        'event': new_event.event,
        'timestamp': new_event.timestamp,
        'playtime': new_event.playtime,
      }
    else:
      json_obj = {
        'has_update': False
      }
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.write(json.dumps(json_obj))
    logging.error("event returned to slave: %s" % json_obj)
    
application = webapp2.WSGIApplication([
  (r'/?', MainPageHandler),
  ('/master', MasterHandler),
  ('/slave', SlaveHandler),
], debug=True)