project(tools-plugins-softkernel-test CXX)

add_test(NAME prepare_${PROJECT_NAME}
  COMMAND ${softshell_BINARY_DIR}/softshell ${forge_SOURCE_DIR}/soft-register-entity ${CMAKE_CURRENT_SOURCE_DIR}/reaction.json)

set_property(TEST prepare_${PROJECT_NAME} PROPERTY
  ENVIRONMENT "LD_LIBRARY_PATH=${soft-kernel_BINARY_DIR}:${soft-tools-plugins-softkernel_BINARY_DIR}:${soft-storage-mongo_BINARY_DIR}:${soft-tools-plugins-mongo_BINARY_DIR}:${soft-storage-plugins-json_BINARY_DIR}:$ENV{LD_LIBRARY_PATH}"
  ENVIRONMENT "SOFTSTORAGE=${soft-storage-mongo_BINARY_DIR}"
  )

# Register entity in the metadata database
add_test(NAME ${PROJECT_NAME}
  COMMAND ${softshell_BINARY_DIR}/softshell ${CMAKE_CURRENT_SOURCE_DIR}/soft-kernel-test.js
  WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR})

if(UNIX)
  set_property(TEST ${PROJECT_NAME} PROPERTY
    ENVIRONMENT "LD_LIBRARY_PATH=${soft-kernel_BINARY_DIR}:${soft-tools-plugins-softkernel_BINARY_DIR}:${soft-storage-mongo_BINARY_DIR}:${soft-tools-plugins-mongo_BINARY_DIR}:${soft-storage-plugins-json_BINARY_DIR}:$ENV{LD_LIBRARY_PATH}"
    ENVIRONMENT "SOFT_MODULES=${softshell_SOURCE_DIR}/modules"
    ENVIRONMENT "SOFTSTORAGE=${soft-storage-mongo_BINARY_DIR}")
else()
  set_property(TEST ${PROJECT_NAME} PROPERTY
    ENVIRONMENT "PATH=${PATH};${soft-kernel_BINARY_DIR};${soft-tools-plugins-softkernel_BINARY_DIR};${soft-storage-plugins-json_BINARY_DIR};$ENV{PATH}"
    ENVIRONMENT "SOFT_MODULES=${softshell_SOURCE_DIR}/modules"
    ENVIRONMENT "SOFTSTORAGE=${soft-storage-mongo_BINARY_DIR}")
endif()
