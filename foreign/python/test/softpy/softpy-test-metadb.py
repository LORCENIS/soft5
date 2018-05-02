#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function

import os

import softpy


thisdir = os.path.dirname(__file__)

# Registers all entities defined in current directory
softpy.register_jsondir(thisdir)

meta = softpy.Metadata(name='Person', version='0.2.4',
                       namespace='http://sintef.no/meta/soft')

Person = softpy.entity(name='Person', version='0.2.4',
                       namespace='http://sintef.no/meta/soft')
jack = Person(name='Jack', age=42, skills=['foo', 'bar'])
assert jack.soft_metadata == meta
