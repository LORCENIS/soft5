#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function

import os

import softpy


thisdir = os.path.dirname(__file__)

A = softpy.entity(open(os.path.join(thisdir, 'A.json')))
B = softpy.entity(open(os.path.join(thisdir, 'B.json')))
C = softpy.entity(open(os.path.join(thisdir, 'C.json')))
D = softpy.entity(open(os.path.join(thisdir, 'D.json')))
E = softpy.entity(open(os.path.join(thisdir, 'E.json')))
ma = A.soft_metadata.mtype
mb = B.soft_metadata.mtype
mc = C.soft_metadata.mtype
md = D.soft_metadata.mtype
me = E.soft_metadata.mtype

#
# Define conversions according to the following graph:
#
#   A<--(B,C)
#   ^      ^
#    \     |
#     E    D
#
def convD2C(d):
    """Converts entities of type D to C."""
    dt = softpy.get_metadict(d)
    return C(s=dt[md].s)

def convE2A(e):
    """Converts entities of type D to A."""
    dt = softpy.get_metadict(e)
    return A(s=dt[me].s, length=100.0 * dt[me].length)

def convBC2A(bc):
    """Converts entities of type B, C to A."""
    dt = softpy.get_metadict(bc)
    return A(s=dt[mc].s, length=100.0 * dt[mb].length)

softpy.register_converter(convD2C, [md], [mc])
softpy.register_converter(convE2A, [me], [ma])
softpy.register_converter(convBC2A, [mb, mc], [ma])

b = B(length=1.2)
c = C(s='c')
d = D(s='d', length=1.4)
e = E(s='e', length=1.6)

a = softpy.convert(ma, [b, c])
assert a.s == 'c'
assert a.length == 120.0

a = softpy.convert(ma, [b, d])
assert a.s == 'd'
assert a.length == 120.0

a = softpy.convert(ma, [e])
assert a.s == 'e'
assert a.length == 160.0

a2 = softpy.convert(ma, [a])
assert a2.s == a.s
assert a2.length == a.length
