#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function

import os
import sys
import pickle

import numpy as np
import softpy

class Data(object):
    pass

thisdir = os.path.dirname(__file__)


def store(e, datamodel):
    softpy.datamodel_append_string(datamodel, 'name', 'NaCl')
    softpy.datamodel_append_int32(datamodel, 'spacegroup_no', 225)
    softpy.datamodel_append_double(datamodel, 'lattice_parameter', 5.64)
    softpy.datamodel_append_array_double(
        datamodel, 'positions',
        np.array([(0.0, 0.0, 0.0), (0.5, 0.5, 0.5)]).flatten())

def load(e, datamodel):
    d = e.user_data
    d.name = softpy.datamodel_get_string(datamodel, 'name')
    d.spgr = softpy.datamodel_get_int32(datamodel, 'spacegroup_no')
    d.latt = softpy.datamodel_get_double(datamodel, 'lattice_parameter')
    d.posi = softpy.datamodel_get_array_double(datamodel, 'positions')

e = softpy.entity_t(
    'MyStructure',                  # get_meta_name
    lambda self: '0.1.1',           # get_meta_version
    'http://sintef.no/meta/soft',   # get_meta_namespace
    ['I', 'J'],                     # get_dimensions
    [3, 4],                         # get_dimension_size
    store,                          # store
    load,                           # load
    None,                           # id
    Data(),                         # user_data
)

assert softpy.entity_get_meta_name(e) == 'MyStructure'
assert softpy.entity_get_meta_version(e) == '0.1.1'
assert softpy.entity_get_meta_namespace(e) == 'http://sintef.no/meta/soft'
assert softpy.entity_get_dimensions(e) == ['I', 'J']
assert softpy.entity_get_dimension_size(e, 'I') == 3
assert softpy.entity_get_dimension_size(e, 'J') == 4
assert softpy.entity_get_id(e) == e.id

assert e.name == 'MyStructure'
assert e.version == '0.1.1'
assert e.namespace == 'http://sintef.no/meta/soft'
assert e.dimensions == ['I', 'J']
assert e.dimension_sizes == [3, 4]

s = softpy.Storage('hdf5', 'softpy-test-entity.h5')
s.save(e)

s.load(e)
d = e.user_data
assert d.name == 'NaCl'
assert d.spgr == 225
assert d.latt == 5.64
assert np.allclose(
    d.posi, np.array([(0.0, 0.0, 0.0), (0.5, 0.5, 0.5)]).flatten())

del e



Person = softpy.load_entity(os.path.join(thisdir, 'person.json'))
person = Person(name='Jack', age=42, skills=[5.4, 7.6, 1.1])

with softpy.Storage('hdf5', 'x.h5') as s:
    s.save(person)


p = Person(uuid=person.__soft_entity__.id)
with softpy.Storage('hdf5', 'x.h5') as s:
    s.load(p)

assert p.name == 'Jack'
assert p.age == 42
assert np.all(p.distances == person.distances)


# Ensure that entity instances are pickleable
# Seems not to work for py3<3.5
dump = pickle.dumps(person)
person2 = pickle.loads(dump)
for k in person.soft_get_property_names():
    assert getattr(person2, k) == getattr(person, k), k
