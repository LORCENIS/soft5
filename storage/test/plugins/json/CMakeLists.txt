project(storage-plugin-json-test CXX)

find_package(GTest REQUIRED)

set(CMAKE_INCLUDE_CURRENT_DIR ON)

aux_source_directory(. SRC_LIST)
add_executable(${PROJECT_NAME} ${SRC_LIST})
include_directories(${soft-kernel_INCLUDE_DIRS}${GTEST_INCLUDE_DIRS})
target_link_libraries(${PROJECT_NAME}
  soft-storage-plugins-json
  ${GTEST_LIBRARIES}) 

add_test(${PROJECT_NAME}
  ${RUNNER} ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME} "${soft-storage-plugins-json_BINARY_DIR}")

if(UNIX)
  set_property(TEST ${PROJECT_NAME} PROPERTY
    message("Setting env LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:${soft-storage-plugins-json_BINARY_DIR}:$ENV{LD_LIBRARY_PATH}")
    ENVIRONMENT "LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:${soft-storage-plugins-json_BINARY_DIR}:$ENV{LD_LIBRARY_PATH}")
else()
  set_property(TEST ${PROJECT_NAME} PROPERTY
    ENVIRONMENT "PATH=${PATH}:$ENV{PATH}")
endif()
