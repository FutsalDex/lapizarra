#!/bin/bash

# Script para limpiar archivos grandes del historial de Git usando BFG

# Paso 1: Clonar el repositorio como espejo
echo "Clonando repositorio como espejo..."
git clone --mirror https://github.com/FutsalDex/lapizarra.git lapizarra-clean.git
cd lapizarra-clean.git || exit

# Paso 2: Descargar BFG
echo "Descargando BFG..."
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar -O bfg.jar

# Paso 3: Eliminar archivos grandes (.node y .pack)
echo "Eliminando archivos grandes con BFG..."
java -jar bfg.jar --delete-files '*.node'
java -jar bfg.jar --delete-files '*.pack'

# Paso 4: Limpiar el historial
echo "Limpiando historial de Git..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Paso 5: Push forzado al repositorio remoto
echo "Haciendo push forzado..."
git push origin --force

echo "Proceso completado. Repositorio limpio y sincronizado."
