#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
from __future__ import division

import os
import time

import softpy


thisdir = os.path.realpath(os.path.abspath(os.path.dirname(__file__)))

# Registers all entities defined in current directory
softpy.register_jsondir(thisdir)


BasePerson = softpy.entity(('Person', '0.2.4', 'http://sintef.no/meta/soft'))


class Person(BasePerson):
    """Our class that inherits from a SOFT-generated base class.

    You should either provide `name`, `age` and `skills` or an `uuid`
    to load from a SOFT storage.
    """
    def __init__(self, name=None, age=None, skills=(),
                 uuid=None, driver=None, uri=None, options=''):
        self.name = name
        self.age = age
        self.skills = list(skills)

        super(Person, self).__init__(
            uuid=uuid, driver=driver, uri=uri, options=options)

        if name:
            self.__init_finalize__()

    def __init_finalize__(self):
        """Adds `birthyear` attribute.

        This attribute cannot be set in __init__() since `age` may not
        be available if __init__() is called internally by softpy, e.g.
        by Collection.get_instance() or during translation.

        If instansiated by softpy, this method will called after all
        properties are set.
        """
        self.birthyear = time.gmtime().tm_year - self.age


niels = Person('Niels Bohr', 77, ('physics', 'football', 'philosophy'))
assert niels.name == 'Niels Bohr'
assert niels.age == 77
assert niels.skills == ['physics', 'football', 'philosophy']
assert niels.birthyear == time.gmtime().tm_year - 77  # ups, we got this wrong..


coll = softpy.Collection()
coll.add('niels', niels)

with softpy.Storage(driver='json', uri='niels.json') as s:
    s.save(coll)
uuid = coll.uuid


coll2 = softpy.Collection(uuid=uuid, driver='json', uri='niels.json')
niels2 = coll2.get_instance('niels')
assert niels2.name == 'Niels Bohr'
assert niels2.age == 77
assert niels2.skills == ['physics', 'football', 'philosophy']
assert niels2.birthyear == time.gmtime().tm_year - 77
