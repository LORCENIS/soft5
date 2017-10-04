#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function

import os
import pickle

#import dill

import softpy

thisdir = os.path.dirname(__file__)


Person = softpy.load_entity(os.path.join(thisdir, 'person.json'))
person = Person(name='Shannon', age=16, skills=['physics', 'singing'])


dump = pickle.dumps(person)
person2 = pickle.loads(dump)
for k in person.soft_get_property_names():
    assert getattr(person2, k) == getattr(person, k), k
