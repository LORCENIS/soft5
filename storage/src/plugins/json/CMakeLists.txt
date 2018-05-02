project (soft-storage-plugins-json C CXX)

set (CMAKE_THREAD_PREFER_PTHREAD TRUE)
set (CMAKE_AUTOMOC TRUE)

include_directories (${soft-kernel_INCLUDE_DIRS})
set (LINK_LIBS ${LINK_LIBS} ${soft-kernel_LIBS})

aux_source_directory (. SRC_LIST)
add_definitions(-DQT_PLUGIN)
add_library (${PROJECT_NAME} SHARED ${SRC_LIST})

target_compile_features(${PROJECT_NAME} PUBLIC cxx_constexpr)
target_link_libraries(${PROJECT_NAME} ${LINK_LIBS})

target_include_directories(${PROJECT_NAME} PUBLIC
  ${soft-storage-plugins-json_INCLUDE_DIRS}
  ${PROJECT_SOURCE_DIR}
  )

install(TARGETS ${PROJECT_NAME}
  ARCHIVE DESTINATION ${STORAGE_PLUGINS_INSTALL_DIR}
  LIBRARY DESTINATION ${STORAGE_PLUGINS_INSTALL_DIR})

install(CODE "execute_process(COMMAND ${CMAKE_COMMAND} -E create_symlink ${CMAKE_INSTALL_PREFIX}/${STORAGE_PLUGINS_INSTALL_DIR}/lib${PROJECT_NAME}.so ${CMAKE_INSTALL_PREFIX}/${LIB_INSTALL_DIR}/lib${PROJECT_NAME}.so )")
install(CODE "MESSAGE(\"-- Created symlink: ${CMAKE_INSTALL_PREFIX}/${LIB_INSTALL_DIR}/lib${PROJECT_NAME}.so -> ${CMAKE_INSTALL_PREFIX}/${STORAGE_PLUGINS_INSTALL_DIR}/lib${PROJECT_NAME}.so  \")")
