project (soft-kernel C CXX)

set (CMAKE_THREAD_PREFER_PTHREAD TRUE)
set (CMAKE_INCLUDE_CURRENT_DIR ON)
set (CMAKE_AUTOMOC ON)

# Generate config.h from config.h.in
configure_file("config.h.in" "config.h")

set (LINK_LIBS ${LINK_LIBS}
  Qt5::Core
  Qt5::Network
  Qt5::Script
  Qt5::Concurrent)

aux_source_directory(. SRC_LIST)
add_library (${PROJECT_NAME} SHARED ${SRC_LIST})

include_directories(
  ${CMAKE_CURRENT_BINARY_DIR}
  )

target_include_directories(${PROJECT_NAME} PUBLIC
  ${CMAKE_CURRENT_SOURCE_DIR}
  ${CMAKE_CURRENT_BINARY_DIR})

target_compile_features(${PROJECT_NAME} PUBLIC cxx_constexpr)
target_link_libraries(${PROJECT_NAME} ${LINK_LIBS})

# Export/import declaration for Windows
generate_export_header(${PROJECT_NAME})

# Expose public includes to other subprojects
set(${PROJECT_NAME}_INCLUDE_DIRS
  ${PROJECT_SOURCE_DIR}
  ${CMAKE_CURRENT_BINARY_DIR}
  CACHE INTERNAL "${PROJECT_NAME}: Include Directories" FORCE)

set(${PROJECT_NAME}_LIBS
  ${PROJECT_NAME}
  ${LINK_LIBS}
  CACHE INTERNAL "${PROJECT_NAME}: Link Libs" FORCE)

install_runtime_library(${PROJECT_NAME} ${LIB_INSTALL_DIR})
install(DIRECTORY .
  DESTINATION ${INCLUDE_INSTALL_DIR}
  FILES_MATCHING PATTERN "*.h")
install(FILES Soft DESTINATION ${INCLUDE_INSTALL_DIR})
install(FILES ${CMAKE_CURRENT_BINARY_DIR}/config.h DESTINATION ${INCLUDE_INSTALL_DIR})
