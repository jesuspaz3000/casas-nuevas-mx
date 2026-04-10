#!/bin/bash

# Cargar variables de entorno
set -a
source .env
set +a

# Ejecutar la aplicación
mvn spring-boot:run
