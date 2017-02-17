# -*- python -*-

%pythoncode %{

import os
import sys
import json
import ast
import operator

import numpy as np


class SoftError(Exception):
    """Base class for SOFT exceptions."""
    pass

class SoftUninitializedError(SoftError):
    """Raised when working with uninitialized data."""
    pass

class SoftStorageClosedError(SoftError):
    """Raised when working on a closed storage."""
    pass

class SoftMissingDimensionsError(SoftError):
    """Raised if dimensions are missing or cannot be derived."""
    pass

class SoftInvalidDimensionsError(SoftError):
    """Raised if an invalid dimension label is used."""
    pass

class SoftInvalidPropertyError(SoftError):
    """Raised if an invalid property name is used."""
    pass

class SoftMetadataError(SoftError):
    """Raised on malformed metadata description."""
    pass

class SoftMissingMetadataError(SoftError):
    """Raised when metadata cannot be found in the database."""
    pass

class SettingDerivedPropertyError(Exception):
    """Users of softpy can raise this exception in setters for derived
    properties.  This exception will signal to the storage loader, of all
    classes inheriting from a class created with the entity factory, that
    the property should not be set.  Example:

        myprop = property(
            lambda self: "hello world",
            lambda self, value: derived_property_exception('myprop'))
    """
    pass

class ArithmeticError(Exception):
    """Raised by arithmetic_eval() on errors in the evaluated expression."""
    pass


class Uninitialized(object):
    """Class representing uninitialized values. Not intended to be
    instanciated..."""


class Storage(object):
    """Class for connecting to a storage.

    Parameters
    ----------
    driver : "json" | "hdf5" | "mongo"...
        The storage driver to use.  Available drivers can be obtained from
        softpy.get_storage_drivers().
    uri : string
        Storage uri.  For json or hdf5 this might be a file name, but might
        be a url for database connections.
    options : None | string
        Additional options passed to the driver.
    """
    def __init__(self, driver, uri, options=None):
        self.driver = driver
        self.uri = uri
        self.options = options
        self.storage = storage_create(driver, uri, options)
        self.strategy = storage_get_storage_strategy(self.storage)
        self._closed = False

    def save(self, entity, uuid=None):
        """Saves entity in this storage.  By default `entity` is stored
        under its own id, but by providing `uuid` you can store it under this
        id instead."""
        if self.closed:
            raise SoftClosedStorageError('Storage %r is closed.' % self.uri)
        e = get_c_entity(entity)
        datamodel = storage_strategy_get_datamodel(self.strategy)
        datamodel_set_id(datamodel, asStr(uuid if uuid else e.id))
        datamodel_set_meta_name(datamodel, asStr(e.name))
        datamodel_set_meta_version(datamodel, asStr(e.version))
        datamodel_set_meta_namespace(datamodel, asStr(e.namespace))
        entity_store(e, datamodel)   # Ask the entity to fill out the datamodel
        storage_strategy_store(self.strategy, datamodel)
        storage_strategy_free_datamodel(datamodel)

    def load(self, entity, uuid=None):
        """Fills `entity` with data loaded from this storage.  By default
        `entity` is loaded from its own id, but by providing `uuid` can load
        it from this id instead."""
        if self.closed:
            raise SoftClosedStorageError('Storage %r is closed.' % self.uri)
        e = get_c_entity(entity)
        datamodel = storage_strategy_get_datamodel(self.strategy)
        datamodel_set_id(datamodel, asStr(uuid if uuid else e.id))
        datamodel_set_meta_name(datamodel, asStr(e.name))
        datamodel_set_meta_version(datamodel, asStr(e.version))
        datamodel_set_meta_namespace(datamodel, asStr(e.namespace))
        storage_strategy_start_retrieve(self.strategy, datamodel)
        entity_load(e, datamodel)  # Ask the entity to fill out itself
        storage_strategy_end_retrieve(self.strategy, datamodel)
        storage_strategy_free_datamodel(datamodel)

    def close(self):
        """Closes current storage."""
        if self.closed:
            raise SoftClosedStorageError('Storage %r is closed.' % self.uri)
        storage_free_storage_strategy(self.strategy)
        storage_free(self.storage)
        self._closed = True

    closed = property(lambda self: self._closed,
                      doc='Whether current storage is closed.')

    def __delete__(self):
        if not self.closed:
            self.close()
        object.__del__(self)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
       self.close()

    def __repr__(self):
        if self.options:
            return "Storage(%r, %r, %r)" % (
                self.driver, self.uri, self.options)
        else:
            return "Storage(%r, %r)" % (self.driver, self.uri)


class Collection(object):
    """A collection of entities with relations between them.

    """
    # Fixme:
    # * Add arguments
    #
    #      uuid=None, driver=None, uri=None, options=None
    #
    #   such that the constructor can load a collection from a storage
    #   in the same way as the entity constructor.
    def __init__(self, id=None):
        if id:
            self.__soft_entity__ = collection_create(id)
        else:
            self.__soft_entity__ = collection_create_new()

    def __delete__(self):
        collection_free(self.__softpy_entity__)
        object.__del__(self)

    def register_entity(self, label, entity):
        """Register a new entity associated with the given label."""
        e = get_c_entity(entity)
        collection_register_entity(self.__soft_entity__, label, e)

    #def add_dim(self, label, description=''):
    #    collection_add_dim(self.__soft_entity__, label, description)

    def add_relation(self, subject, predicate, object_):
        collection_add_relation(self.__soft_entity__,
                                subject, predicate, object_)

    #def connect(self, subject, predicate, object_):
    #    collection_connect(self.__soft_entity__,
    #                       subject, predicate, object_)

    def get_num_entities(self):
        return collection_num_entities(self.__soft_entity__)

    def get_num_relations(self):
         """Returns the total number of relations associated with this
         collection.

         Note: A collection will typically contain many more relations
         than the number of relations you have added with add_relation()
         because relations are also used to associate entity labels with
         the entity type, name, version , namespace and uuid."""
         return collection_num_relations(self.__soft_entity__)

    #def get_num_dim_maps(self):
    #     return collection_num_dim_maps(self.__soft_entity__)
    #
    #def get_dimensions(self):
    #     return collection_get_dimensions(self.__soft_entity__)

    def get_labels(self):
        """Returns a set with all registered entity labels."""
        return self.find_relations('Entity', '^is-a')

    def get_uuid(self, label):
        """Returns the uuid of the entity instance with the given label."""
        uuid, = self.find_relations(label, 'id')
        return uuid

    def get_name(self, label):
        """Returns the name of the entity instance with the given label."""
        uuid, = self.find_relations(label, 'name')
        return uuid

    def get_version(self, label):
        """Returns the version of the entity instance with the given label."""
        uuid, = self.find_relations(label, 'version')
        return uuid

    def get_namespace(self, label):
        """Returns the namespace of the entity instance with the given
        label."""
        uuid, = self.find_relations(label, 'namespace')
        return uuid

    def get_entity(self, label, driver, uri, options=None):
        """Returns the the entity instance associated with `label`
        from the storage specified with `driver`, `uri` and `options`.

        This method depends on that the metadata for `label` exists in
        a metadata database registered with softpy.register_metadb().
        """
        e = entity(self.get_name(label), self.get_version(label),
                   self.get_namespace(label))
        return e(uuid=self.get_uuid(label), driver=driver, uri=uri,
                 options=options)

    name = property(
        lambda self: collection_get_name2(self.__soft_entity__),
        lambda self, name: collection_set_name(
            self.__soft_entity__, name),
        doc='Collection name.'
    )

    version = property(
        lambda self: collection_get_version2(self.__soft_entity__),
        lambda self, version: collection_set_version(
            self.__soft_entity__, version),
        doc='Collection version.'
    )

    def find_relations(self, subject, predicate):
        """Returns a set with all relations matching the given `subject` and
        `predicate`.

        If `predicate` is preceded with "^", the match is inverted, i.e.
        all relations whos object matches `subject` and predicate matches
        the remaining of `predicate` are returned."""
        strlst = collection_find_relations(self.__soft_entity__,
                                        subject, predicate)
        relations = set()
        for i in range(string_list_count(strlst)):
            relations.add(string_at(strlst, i))
        string_list_free(strlst)
        return relations


def get_c_entity(entity):
    """Returns a reference to the underlying C-level entity_t or collection_s."""
    if hasattr(entity, '__soft_entity__'):
        e = entity.__soft_entity__
    else:
        e = entity
    if not isinstance(e, entity_t):
        raise TypeError('Not a proper entity')
    return e


def arithmetic_eval(expr, constants=None, functions=()):
    """Returns the result of arithmetic evaluation of `expr`.  This function
    is much safer to use than eval() and should be preferred for simple
    arithmetic evaluation.

    If given, `constants` should be a dict mapping constant names to values,
    e.g. ``{'pi': math.pi, 'e': math.e}``.

    The `functions` argument should be a sequence of available functions,
    e.g. ``(abs, min, max, math.sin)``.

    This implementation is inspired by
    http://bingbots.com/questions/148864/valueerror-malformed-string-when-using-ast-literal-eval
    """
    binOps = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Mod: operator.mod,
        ast.Pow: operator.pow,
    }
    consts = constants if constants else {}
    funcs = {f.__name__: f for f in functions}
    node = ast.parse(expr, mode='eval')

    def _eval(node):
        if isinstance(node, ast.Expression):
            return _eval(node.body)
        elif isinstance(node, ast.Str):
            return node.s
        elif isinstance(node, ast.Num):
            return node.n
        elif isinstance(node, ast.BinOp):
            return binOps[type(node.op)](_eval(node.left), _eval(node.right))
        elif isinstance(node, ast.Call):  # function call
            if not node.func.id in funcs:
                raise ArithmeticError(
                    'Invalid function %s() in expr: %r' % (node.func.id, expr))
            func = funcs[node.func.id]
            args = tuple(_eval(arg) for arg in node.args)
            keywords = {kw.arg: _eval(kw.value) for kw in node.keywords}
            return func(*args, **keywords)
        elif isinstance(node, ast.Name):  # constant
            if not node.id in consts:
                raise ArithmeticError(
                    'Invalid constant %r in expr: %r' % (node.id, expr))
            return consts[node.id]
        # -- indexing...
        elif isinstance(node, ast.Subscript):
            return _eval(node.value)[_eval(node.slice)]
        elif isinstance(node, ast.Index):
            return _eval(node.value)
        elif isinstance(node, ast.Slice):
            lower = _eval(node.lower) if node.lower else None
            upper = _eval(node.upper) if node.upper else None
            step = _eval(node.step) if node.step else None
            return slice(lower, upper, step)
        # -- some Python containers, not really arithmetic, but useful...
        elif isinstance(node, ast.List):
            return [_eval(v) for v in node.elts]
        elif isinstance(node, ast.Tuple):
            return tuple(_eval(v) for v in node.elts)
        elif isinstance(node, ast.Set):
            return {_eval(v) for v in node.elts}
        elif isinstance(node, ast.Dict):
            return {_eval(k): _eval(v) for k, v in zip(node.keys, node.values)}
        else:
            raise ArithmeticError(
                'Unsupported type %s in expr: %r' % (node, expr))

    return _eval(node.body)


def asBytes(s):
    """Returns `s` as bytes using the default encoding - works for Python
    2.7 and 3.x."""
    if hasattr(s, 'encode'):
        return s.encode()
    return s

def asStr(s):
    """Returns `s` as string using the default encoding - works for Python
    2.7 and 3.x."""
    if isinstance(s, str):
        return s
    if sys.version_info.major == 2:
        if hasattr(s, 'encode'):
            return s.encode()
    else:
        if hasattr(s, 'decode'):
            return s.decode()
    raise TypeError('Cannot convert %r to string' % (s, ))


def _get_entity_method(entity, name):
    """Returns a reference to method `name` in `entity`.
    """
    if hasattr(entity, name):
        attr = getattr(entity, name)
        if hasattr(attr, '__call__'):
            method = attr
    method = getattr(entity, '_' + name)
    assert hasattr(method, '__call__')
    return method


class MetaEntity(type):
    """Metaclass for BaseEntity providing some functionality to entity
    classes that is not inherited by their instances."""
    def __str__(self):
        return json.dumps(self.soft_metadata, indent=2, sort_keys=True)

    def __repr__(self):
        return '<class %s version=%r, namespace=%r)>' % (
            self.soft_metadata['name'], self.soft_metadata['version'],
            self.soft_metadata['namespace'])

    def __len__(self):
        return len(self.soft_metadata['properties'])

    name = property(lambda self: str(self.soft_metadata['name']),
                    doc='Entity name.')
    version = property(lambda self: str(self.soft_metadata['version']),
                       doc='Entity version string.')
    namespace = property(lambda self: str(self.soft_metadata['namespace']),
                         doc='Entity namespace.')
    description = property(lambda self: str(self.soft_metadata['description']),
                           doc='Entity description.')
    dimensions = property(lambda self: [
        str(d['name']) for d in self.soft_metadata['dimensions']],
                          doc='List of dimension labels.')
    property_names = property(lambda self: [
        str(p['name']) for p in self.soft_metadata['properties']],
                              doc='List of property names.')


class BaseEntity(object):
    """Base class for entities created with the entity() factory function.

    To avoid name conflict with properties and making it easy to subclass
    the entity class created with entity(), all attributes of this class
    are starts with "soft_".  The only exception is the special
    "__soft_entity__" attribute, which provides direct access to the c-level
    object.

    Sometimes the automatic derivation of dimension sizes doesn't work
    (e.g. if the properties has dimension "N+1", softpy is not smart enough
    to determine the size of dimension "N").  In these cases you can either
    provide the argument `dimension_sizes` to the constructor, but it is
    often more convenient to override soft_internal_dimension_size() in
    your subclass.
    """
    __metaclass__ = MetaEntity

    def __init__(self, uuid=None, driver=None, uri=None, options=None,
                 dimension_sizes=None, uninitialize=True, **kwargs):
        """Initialize a new entity.

        If `uuid`, `driver` and `uri` are given, initial property
        values of the new entity will be loaded from dataset `uuid` is
        storage `uri`.  Otherwise a new empty entity will be created.

        Parameters
        ----------
        uuid : None | string
            Id of the instance.  If `driver` is given, it should match the
            id of the dataset to load.  The default is to generate a
            new unique id.
        driver : None | "json" | "hdf5" | "mongo" | ...
            The driver to use for loading initial values.
        uri : None | string
            Where the initial values are stored.  Required if `driver` is
            given.
        options : None | string
            Additional options passed to the driver.
        dimension_sizes : None | sequence | dict | callable

            By default the dimension sizes are derived from the
            property sizes (unless the subclass overrides
            soft_internal_dimension_size()).  This requires that for
            each dimensions at least one property has a dimension of
            exactly this size.  If that is not the case (bad design?),
            you have to provide this argument.

            For entities with static dimensions, it can be given as a
            sequence or dict, like ``[3, 5]`` or ``{'I'=3, 'J'=5}``
            provided that the entity has dimensions I and J.

            For entities with dynamic dimensions, `dimension_sizes` must
            be a callable taking two arguments; a softpy.entity_t and
            a dimension label and should return the size of the dimension
            corresponding to the label.
        uninitialize : bool
            If this is true and `driver` is None, all attributes
            representing SOFT properties not initialized with `kwargs`
            will be set to ``softpy.Uninitialized``.
        kwargs :
            Initial property label-value pairs.  These will overwrite
            initial values read from `uri`.
        """
        meta = self.soft_metadata
        dims = [str(d['name']) for d in meta['dimensions']]
        if isinstance(dimension_sizes, dict):
            dimension_sizes = [dimension_sizes[label] for label in dims]
        self.soft_internal_dimension_info = dimension_sizes

        self.__soft_entity__ = entity_t(
            meta['name'],                       # get_meta_name
            meta['version'],                    # get_meta_version
            meta['namespace'],                  # get_meta_namespace
            dims,                               # get_dimensions
            self.soft_internal_dimension_size,  # get_dimension_size
            self.soft_internal_store,           # store
            self.soft_internal_load,            # load
            uuid,                               # id
            self,                               # user_data
        )

        if driver:
            if uuid is None:
                raise TypeError('`uuid` must be provided when initialising '
                                'an entity from storage')
            if uri is None:
                raise TypeError('`uri` must be provided when initialising '
                                'an entity from storage')
            with Storage(driver, uri, options) as s:
                s.load(self)

        propnames = set(self.soft_get_property_names())
        for name, value in kwargs.items():
            if name not in propnames:
                raise SoftInvalidPropertyError(name)
            self.soft_set_property(name, value)

        if uninitialize and not driver:
            for name in propnames:
                if not hasattr(self, name):
                    try:
                        self.soft_set_property(name, Uninitialized)
                    except SettingDerivedPropertyError:
                        pass

    def soft_internal_dimension_size(self, e, label):
        """Returns the size of dimension `label`.

        Used internally by softpy but may be overridded by subclasses.
        The argument `e` corresponds to __soft_entity__ and should
        normally be used when overriding this method.
        """
        if hasattr(self.soft_internal_dimension_info, '__call__'):
            return self.soft_internal_dimension_info(e, label)
        elif isinstance(self.soft_internal_dimension_info, dict):
            # Dynamic size from property, using cached property name
            # and dimension index
            name, ind = self.soft_internal_dimension_info[label]
            prop = self.soft_get_property(name)
            if prop is Uninitialized:
                raise SoftUninitializedError(
                    'cannot determine dimension size from uninitialized '
                    'property: %r' % name)
            if isinstance(prop, np.ndarray):
                return prop.shape[ind]
            else:
                for i in range(ind):
                    prop = prop[0]
                return len(prop)
        elif hasattr(self.soft_internal_dimension_info, '__getitem__'):
            # Static sizes
            dims = entity_get_dimensions(self.__soft_entity__)
            ind = dims.index(label)
            return self.soft_internal_dimension_info[ind]
        else:
            # Associate property name and dimension index with dimensions,
            # for fast retrival of dynamic sizes
            assert self.soft_internal_dimension_info is None
            dimensions = entity_get_dimensions(self.__soft_entity__)
            d = {}
            for lab in dimensions:
                 for name in self.soft_get_property_names():
                     value = self.soft_get_property(name)
                     for i, dim in enumerate(self.soft_get_property_dims(name)):
                         if dim == lab:
                             d[lab] = (name, i)
                 if not lab in d:
                     raise SoftMissingDimensionsError(
                         'cannot determine size of dimension "%s"' % lab)
            assert set(d) == set(dimensions)
            self.soft_internal_dimension_info = d
            return self.soft_internal_dimension_size(e, label)

    def soft_internal_check_dimension_sizes(self):
        """Checks that the dimension sizes of properties is consistent with
        the metadata definitions.  Raises SoftInvalidDimensionsError for
        inconsistencies."""
        for d in self.soft_metadata['properties']:
             name = asStr(d['name'])
             value = getattr(self, name)
             if value is not Uninitialized and 'dims' in d:
                 for label in d['dims']:
                     dimsize = self.soft_get_dimension_size(asStr(label))
                     if len(value) != dimsize:
                         raise SoftInvalidDimensionsError(
                             'length of dimension %r of property %r is %d, '
                             'expected %d' % (label, name, len(value), dimsize))
                     if len(value) == 0:  # can't continue for zero-sized dims
                         break
                     value = value[0]

    def soft_internal_store(self, e, datamodel):
        """Stores property values to `datamodel`, raising SoftUnitializedError
        if any property is uninitialized.

        Normally you would not call this function directly, but
        instead through Storage.save()."""
        for label in self.soft_get_dimensions():
            value = self.soft_get_dimension_size(label)
            datamodel_append_dimension(datamodel, label, value)

        for name in self.soft_get_property_names():
            value = self.soft_get_property(name)
            if value is Uninitialized:
                raise SoftUninitializedError(
                    'Uninitialized data for "%s.%s"' % (
                        self.__class__.__name__, name))
            vtype = self.soft_get_property_type(name)
            dims = self.soft_get_property_dims(name)
            if not dims:
                setter = getattr(_softpy, 'datamodel_append_' + vtype)
            elif vtype == 'string' or vtype == 'string_list':
                assert len(dims) == 1
                setter = getattr(_softpy, 'datamodel_append_string_list')
            elif len(dims) == 1:
                setter = getattr(_softpy, 'datamodel_append_array_' + vtype)
            else:
                setter = getattr(_softpy, 'datamodel_append_array_%s_%dd' % (
                    vtype, len(dims)))
            #print('*** name=%r -> %r' % (name, setter))
            try:
                setter(datamodel, asStr(name), value)
            except Exception as ex:
                ex.args = ('%s.%s: %s' % (
                    self.__class__.__name__, name, ex), ) + ex.args[1:]
                raise  # reraise exception with property prepended to message

    def soft_internal_load(self, e, datamodel):
        """Loads property values from `datamodel` into self.  Normally you
        would not call this function directly, but instead through
        Storage.load()."""
        for name in self.soft_get_property_names():
            vtype = self.soft_get_property_type(name)
            dims = self.soft_get_property_dims(name)
            if not dims:
                getter = getattr(_softpy, 'datamodel_get_' + vtype)
            elif vtype == 'string_list' or vtype == 'string':
                assert len(dims) == 1
                getter = getattr(_softpy, 'datamodel_get_string_list')
            elif len(dims) == 1:
                getter = getattr(_softpy, 'datamodel_get_array_' + vtype)
            else:
                getter = getattr(_softpy, 'datamodel_get_array_%s_%dd' % (
                    vtype, len(dims)))
            #print('*** name=%r <- %r' % (name, getter))
            value = getter(datamodel, str(name))
            #print('    self=%r, value=%r' % (self, value))
            try:
                self.soft_set_property(asStr(name), value)
            except SettingDerivedPropertyError:
                pass
            except Exception as ex:
                ex.args = ('%s.%s: %s' % (
                    self.__class__.__name__, name, ex), ) + ex.args[1:]
                raise  # reraise exception with property prepended to message

    def soft_initialized(self):
        """Returns true if all properties are initialized. False is returned
        otherwise."""
        return all(self.soft_get_property(name) is not Uninitialized
                   for name in self.soft_get_property_names())

    def soft_get_property(self, name):
         """Returns the value of property `name`.  The default implementation
         checks if there exists a method get_`name`().  If so, the the
         result of calling get_`name`() with no argument is returned.
         Otherwise the value of attribute `name` is returned."""
         getter = 'get_' + name
         if hasattr(self, getter):
             return getattr(self, getter)()
         elif hasattr(self, name):
             return getattr(self, name)
         else:
             raise SoftInvalidPropertyError(name)

    def soft_set_property(self, name, value):
         """Sets property `name` to value.  The default implementation checks
         if there exists a method set_`name`().  If so, set_`name`() is called
         with `value` as argument.  Otherwise the attribute `name` is set to
         `value`."""
         setter = 'set_' + name
         if hasattr(self, setter):
             getattr(self, setter)(value)
         else:
             setattr(self, name, value)

    def soft_get_id(self):
        """Returns entity id."""
        return entity_get_id(self.__soft_entity__)

    def soft_get_meta_name(self):
        """Returns entity name."""
        return entity_get_name(self.__soft_entity__)

    def soft_get_meta_version(self):
        """Returns entity version."""
        return entity_get_name(self.__soft_entity__)

    def soft_get_meta_namespace(self):
        """Returns entity name space."""
        return entity_get_namespace(self.__soft_entity__)

    @classmethod
    def soft_get_meta_description(cls):
        """Returns description of entity."""
        return cls.soft_metadata.get('description', '')

    def soft_get_dimensions(self):
        """Returns a list of dimension labels."""
        return entity_get_dimensions(self.__soft_entity__)

    def soft_get_dimension_size(self, label):
        """Returns size of dimension `label`.  If `label` is not a valid
        dimension label -1 is returned."""
        return entity_get_dimension_size(self.__soft_entity__, label)

    @classmethod
    def soft_get_property_names(cls):
        """Returns a list with the name of all properties."""
        return [p['name'] for p in cls.soft_metadata['properties']]

    @classmethod
    def soft_get_property_unit(cls, name):
        """Returns unit for property `name`, or and empty string if
        `property_name` has no unit."""
        return _get_prop_info(cls, asStr(name), 'unit', '')

    @classmethod
    def soft_get_property_type(cls, name):
        """Returns the type of property `name`."""
        ptype = _get_prop_info(cls, asStr(name), 'type')
        if not ptype:
            raise SoftMetadataError(
                'property "%s" has no type information' % name)
        return ptype

    @classmethod
    def soft_get_property_description(cls, name):
        """Returns description of property `name`."""
        return _get_prop_info(cls, asStr(name), 'description', '')

    @classmethod
    def soft_get_property_dims(cls, name):
        """Returns a list with the dimensions of property `name`."""
        return _get_prop_info(cls, asStr(name), 'dims', [])

    def soft_get_property_dim_sizes(self, name):
        """Returns a list with the dimensions of property `name` evaluated
        to integers."""
        sizes = [(label, get_dimension_size(self.__soft_entity__, label))
                 for label in get_dimensions(self.__soft_entity__)]
        dim_sizes = []
        for sizeexpr in self.soft_get_property_dims(asStr(name)):
             for label, size in sizes:
                 sizeexpr = sizeexpr.replace(label, str(size))
             dim_sizes.append(arithmetic_eval(sizeexpr))
        return dim_sizes


def _get_prop_info(cls, name, field, default=None):
    """Help function used by BaseEntity class methods."""
    for p in cls.soft_metadata['properties']:
        if p['name'] == name:
            return p.get(field, default)
    raise SoftInvalidPropertyError('%s has no property named "%s"' % (
        cls.soft_metadata['name'], field))



def entity(name, version=None, namespace=None):
    """Factory fuction for creating an Entity class object.

    See the class docstring for Metadata for supported values for
    `name`, `version` and `namespace`."""
    meta = Metadata(name, version, namespace)
    attr = dict(soft_metadata=meta)
    return type(meta.name, (BaseEntity,), attr)




class Metadata(dict):
    """A class representing SOFT metadata.

    Parameters
    ----------
    name : str | Metadata | Entity | Entity instance | file-like | dict
        If `version` and `namespace` are given, this is the
        metadata name.

        Otherwise, this is a full description of the metadata in one of
        following forms:
          - Metadata object or dict
          - SOFT entity or entity instance
          - file-like object with a read() method with the metadata in json-
            format.
          - string with the metadata in json-format
    version : None | str
        Metadata version or None if `name` provides full
        description of the metadata.
    namespace : None | str
        Metadata namespace or None if `name` provides full
        description of the metadata.  """
    def __init__(self, name, version=None, namespace=None):
        if version is None or namespace is None:
            if hasattr(name, 'soft_metadata'):
                d = name.soft_metadata
            elif hasattr(name, 'read'):
                d = json.load(name)
            elif isinstance(name, str):
                d = json.loads(name)
            elif sys.version_info.major == 2 and isinstance(name, unicode):
                d = json.loads(name.decode('utf8'))
            elif isinstance(name, dict):
                d = name
            else:
                raise TypeError(
                    'Cannot convert %s to metadata' % (type(name),))
        else:
            d = find_metadata(name, version, namespace)
        self.update(d)

    def __str__(self):
        return self.json()

    name = property(lambda self: asStr(self['name']))
    version = property(lambda self: asStr(self['version']))
    namespace = property(lambda self: asStr(self['namespace']))
    description = property(lambda self: asStr(self['description']))
    dimensions = property(lambda self: [
        str(asStr(d['name'])) for d in self['dimensions']],
                          doc='List of dimension labels.')
    property_names = property(lambda self: [
            asStr(p['name']) for p in self['properties']],
                              doc='List of property names.')

    def json(self):
        """Returns a json string representing this metadata."""
        return json.dumps(self, indent=2, sort_keys=True)



#
# Metadata database interface
# ===========================

# FIXME: functionality should be implemented in C++?
# FIXME: add support for converters
class MetaDB(object):
    """A base class for metadata databases."""
    def __init__(self, **kwargs):
        """Connects to the database."""
        raise NotImplementedError

    def find(self, name, version, namespace):
        """Returns a Metadata object for the given name, version and
        namespace.

        Should raise SoftMissingMetadataError if not metadata can be found.
        """
        raise NotImplementedError

    def insert(self, metadata):
        """Inserts `metadata` into the database.

        May not be implemented by all subclasses."""
        raise NotImplementedError

    def types(self):
        """Returns a list of (name, version, namespace)-tuples for all
        registered metadata.

        May not be implemented by all subclasses."""
        raise NotImplementedError

    def close(self):
        """Closes the connection to the database."""
        raise NotImplementedError

    def has(self, name, version, namespace):
        """Returns whether metadata with the given name, version and
        namespace exists in the database."""
        try:
            self.find(name, version, namespace)
        except SoftError:
            return False
        return True


class JSONMetaDB(MetaDB):
    """A simple metadata database using a json file.

    The `fname` argument should either be a file name or an open
    file-like object.

    Note, if `fname` is a file-like object, it will not be closed
    when the close() method is called on the returned database object.
    """
    def __init__(self, fname):
        self.fname = fname
        if hasattr(fname, 'read'):
            self.data = json.load(fname)
        elif not os.path.exists(fname):
            self.data = []
        else:
            with open(fname) as f:
                self.data = json.load(f)
        self.changed = False
        self.closed = False

    def find(self, name, version, namespace):
        """Returns a Metadata object for the given name, version and
        namespace.

        SoftMissingMetadataError is raised if not metadata can be found."""
        for meta in self.data:
            if (meta.name == name and
                meta.version == version and
                meta.namespace == namespace):
                return meta
        raise SoftMissingMetadataError('Cannot find metadata %s/%s-%s' % (
            namespace, name, version))

    def insert(self, metadata):
        """Inserts `metadata` into the database."""
        meta = Metadata(metadata)
        try:
            self.find(meta.name, meta.version, meta.namespace)
        except SoftMissingMetadataError:
            self.data.append(meta)
            self.changed = True
        else:
            raise SoftError('Metadata %s/%s-%s already in the database' % (
                meta.namespace, meta.name, meta.version))

    def types(self):
        """Returns a list of (name, version, namespace)-tuples for all
        registered metadata."""
        return [(meta.name, meta.version, meta.namespace) for meta in self.data]

    def flush(self):
        """Flushes the database to file."""
        if self.changed:
            if hasattr(self.fname, 'read'):
                json.dump(self.data, fname, indent=2, sort_keys=True)
            else:
                with open(self.fname, 'w') as f:
                    json.dump(self.data, f, indent=2, sort_keys=True)

    def clear(self):
        """Removes all metadata in the database.  This is probably only
        useful for testing."""
        if self.data:
            self.changed = True
        self.data[:] = []   # clear

    def close(self):
        """Closes the connection to the database."""
        self.flush()
        self.closed = True


class MongoMetaDB(MetaDB):
    """A simple metadata database for mongodb.

    Parameters
    ----------
    uri : string
        URI of database to connect to.
    dbname : string
        Name of the mongodb database.
    collection_name : string
        Name of mongodb collection to connect to.

    Note: this requires that you have pymongo installed.
    """
    def __init__(self, uri, dbname, collection_name):
        import pymongo
        self.client = pymongo.MongoClient(uri)
        self.db = self.client[dbname]
        self.coll = self.db[collection_name]

    def find(self, name, version, namespace):
        """Returns a Metadata object for the given name, version and
        namespace.

        SoftMissingMetadataError is raised if not metadata can be found."""
        meta = self.coll.find_one(
            {'name': name, 'version': version, 'namespace': namespace})
        if meta:
            return meta
        raise SoftMissingMetadataError('Cannot find metadata %s/%s-%s' % (
            namespace, name, version))

    def insert(self, metadata):
        """Inserts `metadata` into the database."""
        meta = Metadata(metadata)
        try:
            self.find(meta.name, meta.version, meta.namespace)
        except SoftMissingMetadataError:
            self.coll.insert_one(meta)
            self.changed = True
        else:
            raise SoftError('Metadata %s/%s-%s already in the database' % (
                meta.namespace, meta.name, meta.version))

    def types(self):
        """Returns a list of (name, version, namespace)-tuples for all
        registered metadata."""
        return [(post['name'], post['version'], post['namespace'])
                for post in self.coll.find()]

    def clear(self):
        """Removes all metadata in the database.  This is probably only
        useful for testing."""
        self.coll.delete_many({})

    def close(self):
        """Closes the connection to the database."""
        self.client.close()



_metadbs = []    # list with all registered metadata databases
_metacache = {}  # cache with resently used metadata
def register_metadb(metadb):
    """Registers metadata database `metadb`."""
    _metadbs.append(metadb)

def find_metadata(name, version, namespace):
    """Search through all registered metadata databases and return
    a Metadata object corresponding to `name`, `version`, `namespace`.
    """
    t = name, version, namespace
    if t in _metacache:
        return _metacache[t]
    for db in _metadbs:
        try:
            meta = db.find(*t)
        except SoftMissingMetadataError:
            pass
        else:
            _metacache[t] = meta
            return meta
    raise SoftMissingMetadataError(
        'Cannot find metadata %s/%s-%s' % (namespace, name, version))




# Convinience functions for returning entity info
# -----------------------------------------------
def _get_entity_info(e, field, *args):
    """Help function for returning info about entities."""
    if isinstance(e, entity_t):
        return globals()['entity_get_' + field](e, *args)
    elif hasattr(e, '__soft_entity__'):
        return globals()['entity_get_' + field](e.__soft_entity__, *args)
    else:
        raise TypeError('not an entity: %r' % e)

def get_id(e):
    """Returns the id of entity `e`."""
    return _get_entity_info(e, 'id')

def get_meta_name(e):
    """Returns the name of entity `e`."""
    return _get_entity_info(e, 'meta_name')

def get_meta_version(e):
    """Returns the version of entity `e`."""
    return _get_entity_info(e, 'meta_version')

def get_meta_namespace(e):
    """Returns the namespace of entity `e`."""
    return _get_entity_info(e, 'meta_namespace')

def get_dimensions(e):
    """Returns list of dimension lables for entity `e`."""
    return _get_entity_info(e, 'dimensions')

def get_dimension_size(e, label):
    """Returns size of dimension `label` for entity `e`.  If `label` is
    not a valid dimension label -1 is returned."""
    return _get_entity_info(e, 'dimension_size', label)

def derived_property_exception(msg=''):
    """Convinient function for raising SettingDerivedPropertyError
    within lambdas."""
    raise SettingDerivedPropertyError(msg)

%}
