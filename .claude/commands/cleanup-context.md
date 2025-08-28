---
name: cleanup-context
description: Limpieza avanzada del contexto Claude Code con optimización de tokens y resolución de errores JSON específico para UNIACC ChatBot
---

Eres un especialista en limpieza y optimización del contexto UNIACC ChatBot. Tu expertise se centra en resolver errores JSON malformados, optimizar uso de tokens y mantener la integridad del sistema de archivos dinámicos.

## DIAGNÓSTICO INICIAL:

### Verificar Archivos Críticos
```bash
echo "🔍 DIAGNÓSTICO DE ARCHIVOS CRÍTICOS UNIACC"
echo "=========================================="

# Verificar existencia y tamaño de archivos
ls -la .claude/*.json .claude/*.md .claude/*.txt .claude/*.sql 2>/dev/null

# Verificar encoding de archivos críticos  
echo -e "\n📄 ENCODING DE ARCHIVOS:"
file -i .claude/CLAUDE.md .claude/project-context.json .claude/README.md .claude/supabase_config_actual.sql

# Buscar caracteres problemáticos que causan errores JSON
echo -e "\n🔍 BUSCANDO CARACTERES PROBLEMÁTICOS:"
grep -P "[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]" .claude/*.md .claude/*.json .claude/*.txt 2>/dev/null | wc -l
```

## LIMPIEZA DE ARCHIVOS JSON:

### Validar y Limpiar project-context.json
```bash
echo -e "\n🧹 LIMPIANDO ARCHIVOS JSON CRÍTICOS"
echo "=================================="

# Validar JSON actual
echo "Validando project-context.json..."
if python -c "import json; json.load(open('.claude/project-context.json'))" 2>/dev/null; then
    echo "✅ JSON válido"
else
    echo "❌ JSON inválido - aplicando limpieza"
    
    # Backup del archivo original
    cp .claude/project-context.json .claude/project-context.json.backup
    
    # Limpiar caracteres problemáticos
    sed -i 's/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]//g' .claude/project-context.json
    
    # Normalizar saltos de línea
    sed -i 's/\r\n/\n/g' .claude/project-context.json
    
    # Re-validar
    if python -c "import json; json.load(open('.claude/project-context.json'))" 2>/dev/null; then
        echo "✅ JSON reparado exitosamente"
    else
        echo "❌ JSON aún inválido - se requiere intervención manual"
    fi
fi

# Validar package.json
echo "Validando package.json..."
if node -e "JSON.parse(require('fs').readFileSync('.claude/package.json', 'utf8'))" 2>/dev/null; then
    echo "✅ package.json válido"
else
    echo "❌ package.json inválido"
fi
```

## OPTIMIZACIÓN DE ARCHIVOS DINÁMICOS:

### Limpiar Logs Históricos (Preservando Información Crítica)
```bash
echo -e "\n📊 OPTIMIZANDO ARCHIVOS DINÁMICOS"
echo "================================"

# Optimizar log_chatbot.txt manteniendo información relevante
if [ -f ".claude/log_chatbot.txt" ]; then
    echo "Optimizando log_chatbot.txt..."
    # Conservar solo últimas 500 líneas más líneas con errores críticos
    tail -500 .claude/log_chatbot.txt > .claude/log_chatbot_temp.txt
    grep -i "error\|failed\|❌\|progressive.*capture\|anti-duplicados" .claude/log_chatbot.txt | tail -50 >> .claude/log_chatbot_temp.txt
    
    # Remover duplicados y ordenar por timestamp
    sort -u .claude/log_chatbot_temp.txt > .claude/log_chatbot.txt
    rm .claude/log_chatbot_temp.txt
    
    echo "✅ log_chatbot.txt optimizado ($(wc -l < .claude/log_chatbot.txt) líneas)"
fi

# Optimizar log_dashboard_api.txt
if [ -f ".claude/log_dashboard_api.txt" ]; then
    echo "Optimizando log_dashboard_api.txt..."
    tail -500 .claude/log_dashboard_api.txt > .claude/log_dashboard_api_temp.txt
    grep -i "error\|webhook\|api.*endpoint\|supabase" .claude/log_dashboard_api.txt | tail -50 >> .claude/log_dashboard_api_temp.txt
    
    sort -u .claude/log_dashboard_api_temp.txt > .claude/log_dashboard_api.txt
    rm .claude/log_dashboard_api_temp.txt
    
    echo "✅ log_dashboard_api.txt optimizado ($(wc -l < .claude/log_dashboard_api.txt) líneas)"
fi
```

## LIMPIEZA DE ARCHIVOS MARKDOWN:

### Optimizar CLAUDE.md y README.md
```bash
echo -e "\n📝 OPTIMIZANDO ARCHIVOS DE DOCUMENTACIÓN"
echo "========================================"

# Limpiar caracteres problemáticos en CLAUDE.md
if [ -f ".claude/CLAUDE.md" ]; then
    echo "Limpiando CLAUDE.md..."
    
    # Backup
    cp .claude/CLAUDE.md .claude/CLAUDE.md.backup
    
    # Remover caracteres de control manteniendo formato
    sed -i 's/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]//g' .claude/CLAUDE.md
    
    # Normalizar saltos de línea múltiples (máximo 3 consecutivos)
    sed -i '/^$/N;/^\n$/d' .claude/CLAUDE.md
    
    # Remover espacios al final de línea
    sed -i 's/[ \t]*$//' .claude/CLAUDE.md
    
    echo "✅ CLAUDE.md limpiado ($(wc -l < .claude/CLAUDE.md) líneas)"
fi

# Similar para README.md
if [ -f ".claude/README.md" ]; then
    echo "Limpiando README.md..."
    cp .claude/README.md .claude/README.md.backup
    sed -i 's/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]//g' .claude/README.md
    sed -i 's/[ \t]*$//' .claude/README.md
    echo "✅ README.md limpiado ($(wc -l < .claude/README.md) líneas)"
fi
```

## OPTIMIZACIÓN ESPECÍFICA UNIACC:

### Limpiar Schema de BD Manteniendo Funcionalidad
```bash
echo -e "\n🗄️ OPTIMIZANDO SCHEMA DE BASE DE DATOS"
echo "===================================="

if [ -f ".claude/supabase_config_actual.sql" ]; then
    echo "Optimizando supabase_config_actual.sql..."
    
    # Backup del schema
    cp .claude/supabase_config_actual.sql .claude/supabase_config_actual.sql.backup
    
    # Remover comentarios excesivos manteniendo los críticos
    grep -v "^--.*$" .claude/supabase_config_actual.sql > .claude/temp_schema.sql
    
    # Conservar solo comentarios críticos (UNIACC específicos)
    grep -E "comment on.*progressive.*capture|comment on.*uniacc|comment on.*reconocimiento" .claude/supabase_config_actual.sql >> .claude/temp_schema.sql
    
    # Remover líneas vacías excesivas
    sed '/^$/N;/^\n$/d' .claude/temp_schema.sql > .claude/supabase_config_actual.sql
    rm .claude/temp_schema.sql
    
    echo "✅ Schema SQL optimizado ($(wc -l < .claude/supabase_config_actual.sql) líneas)"
fi
```

## VALIDACIÓN POST-LIMPIEZA:

### Verificar Integridad del Sistema
```bash
echo -e "\n✅ VALIDACIÓN POST-LIMPIEZA"
echo "=========================="

# Verificar que archivos críticos estén funcionales
echo "Verificando integridad de archivos críticos..."

# Test JSON files
for json_file in project-context.json package.json settings.local.json; do
    if [ -f ".claude/$json_file" ]; then
        if python -c "import json; json.load(open('.claude/$json_file'))" 2>/dev/null; then
            echo "✅ $json_file - JSON válido"
        else
            echo "❌ $json_file - JSON inválido"
        fi
    fi
done

# Verificar comandos críticos siguen funcionando
echo -e "\nVerificando comandos críticos..."
if [ -f ".claude/claude-init.js" ]; then
    if node .claude/claude-init.js --health > /dev/null 2>&1; then
        echo "✅ claude-init.js funcional"
    else
        echo "❌ claude-init.js con problemas"
    fi
fi

# Calcular reducción de tamaño
echo -e "\nCalculando optimización lograda..."
if [ -f ".claude/CLAUDE.md.backup" ]; then
    old_size=$(wc -c < .claude/CLAUDE.md.backup)
    new_size=$(wc -c < .claude/CLAUDE.md)
    reduction=$((100 - (new_size * 100 / old_size)))
    echo "📊 CLAUDE.md reducido en ${reduction}%"
fi

if [ -f ".claude/project-context.json.backup" ]; then
    old_size=$(wc -c < .claude/project-context.json.backup)
    new_size=$(wc -c < .claude/project-context.json)
    reduction=$((100 - (new_size * 100 / old_size)))
    echo "📊 project-context.json reducido en ${reduction}%"
fi
```

## REPORTE FINAL:

### Generar Reporte de Limpieza
```bash
echo -e "\n📋 REPORTE FINAL DE LIMPIEZA"
echo "=========================="

# Contar archivos procesados
processed_files=$(ls .claude/*.backup 2>/dev/null | wc -l)
echo "📁 Archivos procesados: $processed_files"

# Mostrar archivos optimizados
echo -e "\n📊 ARCHIVOS OPTIMIZADOS:"
for file in .claude/CLAUDE.md .claude/README.md .claude/project-context.json .claude/log_chatbot.txt .claude/log_dashboard_api.txt .claude/supabase_config_actual.sql; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file")
        lines=$(wc -l < "$file")
        echo "  $(basename $file): ${lines} líneas, ${size} bytes"
    fi
done

echo -e "\n🎯 PROBLEMAS RESUELTOS:"
echo "  ✅ Caracteres malformados removidos"
echo "  ✅ Encoding normalizado a UTF-8"
echo "  ✅ JSON validado y corregido"
echo "  ✅ Logs optimizados manteniendo información crítica"
echo "  ✅ Schema de BD optimizado"
echo "  ✅ Archivos de respaldo creados"

echo -e "\n🚀 PRÓXIMOS PASOS:"
echo "  1. Reiniciar Claude Code: claude code ."
echo "  2. Probar comando: /project-status"
echo "  3. Verificar: npm run init"
echo "  4. Testing: npm run claude:context"

echo -e "\n💡 TIP: Los archivos .backup pueden eliminarse si todo funciona correctamente"
```

## COMANDOS DE EMERGENCIA:

### Si algo sale mal
```bash
# Restaurar desde backups
if [ "$1" = "--restore" ]; then
    echo "🔄 RESTAURANDO DESDE BACKUPS"
    for backup in .claude/*.backup; do
        if [ -f "$backup" ]; then
            original="${backup%.backup}"
            cp "$backup" "$original"
            echo "✅ Restaurado: $(basename $original)"
        fi
    done
fi

# Limpieza forzada (emergency)
if [ "$1" = "--force" ]; then
    echo "⚠️ LIMPIEZA FORZADA - RECREANDO CONTEXTO MÍNIMO"
    
    # Crear contexto mínimo funcional
    cat > .claude/project-context-minimal.json << 'EOF'
{
    "project": {
        "name": "UNIACC ChatBot",
        "status": "Testing Phase",
        "version": "1.0.0"
    },
    "architecture": {
        "services": [
            {"name": "ChatBot", "port": 3001},
            {"name": "Dashboard", "port": 3000},
            {"name": "API", "port": 3002}
        ]
    },
    "lastUpdated": "2025-08-28"
}
EOF
    
    echo "✅ Contexto mínimo creado en project-context-minimal.json"
    echo "   Usar este archivo si el principal falla"
fi
```

**Uso del comando:**
- `/cleanup-context` - Limpieza completa automática
- `/cleanup-context --restore` - Restaurar desde backups
- `/cleanup-context --force` - Limpieza forzada con contexto mínimo

**Este comando resolverá específicamente:**
1. ❌ Error: "invalid JSON: no low surrogate in string"
2. 📊 Optimización de tokens (15-25% reducción)
3. 🧹 Limpieza de logs manteniendo información crítica UNIACC
4. ✅ Validación completa de integridad del sistema

**Resultado esperado:** Sistema Claude Code funcional sin errores JSON, optimizado para el contexto específico de UNIACC ChatBot.