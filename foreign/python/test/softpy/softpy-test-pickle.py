#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function

import os
import sys
import pickle
import warnings

# dill is required for pickling python2
if sys.version_info.major < 3:
    try:
        import dill
    except ImportError:
        warnings.warn('dill is required for pickling in python2')
        sys.exit()

import softpy


thisdir = os.path.dirname(__file__)


# ----------------------------------------------
# Test pickling instance of dynamic soft entity
# ----------------------------------------------
Person = softpy.load_entity(os.path.join(thisdir, 'person.json'))
person = Person(name='Shannon', age=16, skills=['physics', 'singing'])

dump = pickle.dumps(person)
person2 = pickle.loads(dump)
for k in person.soft_get_property_names():
    assert getattr(person2, k) == getattr(person, k), k


# -----------------------------------------------------------------
# Test pickling instance of a class extending a dynamic soft entity
# -----------------------------------------------------------------
class NextPerson(Person):
    def __init__(self, height=178, **kwargs):
        Person.__init__(self, **kwargs)
        self.height = height

nextperson = NextPerson(name='Eric', age=14, skills=['juggling', 'balancing'],
                        height=156)

dump2 = pickle.dumps(nextperson)
nextperson2 = pickle.loads(dump2)
for k in nextperson.soft_get_property_names():
    assert getattr(nextperson2, k) == getattr(nextperson, k), k
assert nextperson2.height == nextperson.height
