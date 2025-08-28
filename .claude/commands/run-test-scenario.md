{
  "templates_system": {
    "description": "Sistema completo de templates de testing para UNIACC ChatBot",
    "structure": ".claude/templates/",
    "files": [
      "test-scenarios/*.json",
      "prompts/*.md", 
      "commands/run-test-scenario.md",
      "scripts/test-runner.js"
    ]
  },
  
  "test_scenarios": {
    
    "progressive-capture-complete": {
      "name": "Usuario Nuevo - Progressive Capture Completo",
      "description": "Test del flujo completo de captura progresiva sin abandonos",
      "scenario": {
        "user_id": "test_user_complete_001",
        "whatsapp": "56912345001", 
        "steps": [
          {
            "step": 1,
            "action": "send_message",
            "message": "hola",
            "expected_response": "¡Hola! 🎓 Soy el asistente virtual de UNIACC",
            "expected_state": "captura_inicial/solicitar_nombre",
            "database_check": "no_prospecto_exists"
          },
          {
            "step": 2,
            "action": "send_message", 
            "message": "Juan Pérez",
            "expected_response": "Perfecto Juan Pérez",
            "expected_state": "captura_inicial/solicitar_email",
            "database_check": {
              "table": "prospectos",
              "conditions": {
                "whatsapp": "56912345001",
                "nombre": "Juan Pérez",
                "tipo_consulta": "captura en proceso"
              }
            }
          },
          {
            "step": 3,
            "action": "send_message",
            "message": "juan.perez@test.com",
            "expected_response": "Gracias por tu email",
            "expected_state": "captura_inicial/solicitar_edad",
            "database_check": {
              "table": "prospectos", 
              "conditions": {
                "email": "juan.perez@test.com",
                "tipo_consulta": "captura en proceso"
              }
            }
          },
          {
            "step": 4,
            "action": "send_message",
            "message": "25",
            "expected_response": "Perfecto, tienes 25 años",
            "expected_state": "captura_inicial/solicitar_region",
            "database_check": {
              "table": "prospectos",
              "conditions": {
                "edad": 25,
                "tipo_consulta": "captura en proceso"
              }
            }
          },
          {
            "step": 5,
            "action": "send_message",
            "message": "7",
            "expected_response": "Región Metropolitana",
            "expected_state": "captura_inicial/solicitar_telefono", 
            "database_check": {
              "table": "prospectos",
              "conditions": {
                "region": "Metropolitana",
                "tipo_consulta": "captura en proceso"
              }
            }
          },
          {
            "step": 6,
            "action": "send_message",
            "message": "987654321",
            "expected_response": "¡Perfecto! Ahora puedes explorar nuestras opciones",
            "expected_state": "menu_principal/null",
            "database_check": {
              "table": "prospectos",
              "conditions": {
                "telefono": "987654321",
                "tipo_consulta": "captura completa"
              }
            }
          }
        ],
        "success_criteria": [
          "Usuario completa captura de todos los campos",
          "Cada campo se guarda inmediatamente en BD",
          "Estado evoluciona correctamente: proceso → completa",
          "No se crean prospectos duplicados",
          "Usuario llega al menú principal"
        ],
        "cleanup": {
          "delete_test_data": true,
          "whatsapp_numbers": ["56912345001"]
        }
      }
    },

    "progressive-capture-abandono-email": {
      "name": "Progressive Capture - Abandono después de Email",
      "description": "Test abandono después de capturar nombre + email",
      "scenario": {
        "user_id": "test_user_abandono_email_002",
        "whatsapp": "56912345002",
        "steps": [
          {
            "step": 1,
            "action": "send_message",
            "message": "hola",
            "expected_state": "captura_inicial/solicitar_nombre"
          },
          {
            "step": 2, 
            "action": "send_message",
            "message": "María González",
            "expected_state": "captura_inicial/solicitar_email",
            "database_check": {
              "table": "prospectos",
              "conditions": {
                "nombre": "María González",
                "tipo_consulta": "captura en proceso"
              }
            }
          },
          {
            "step": 3,
            "action": "send_message", 
            "message": "maria.gonzalez@test.com",
            "expected_state": "captura_inicial/solicitar_edad",
            "database_check": {
              "table": "prospectos",
              "conditions": {
                "email": "maria.gonzalez@test.com", 
                "tipo_consulta": "captura en proceso"
              }
            }
          },
          {
            "step": 4,
            "action": "simulate_timeout",
            "timeout_minutes": 10,
            "expected_result": "timeout_handler_triggered"
          }
        ],
        "post_timeout_checks": [
          {
            "database_check": {
              "table": "prospectos",
              "conditions": {
                "whatsapp": "56912345002",
                "nombre": "María González",
                "email": "maria.gonzalez@test.com",
                "tipo_consulta": "abandono con email",
                "edad": null,
                "telefono": null
              }
            }
          }
        ],
        "success_criteria": [
          "Datos parciales se conservan en BD",
          "tipo_consulta se actualiza a 'abandono con email'",
          "Campos no capturados permanecen null",
          "Prospecto queda disponible para follow-up"
        ]
      }
    },

    "returning-user-recognition": {
      "name": "Usuario Recurrente - Reconocimiento Automático", 
      "description": "Test del sistema de reconocimiento de usuarios que regresan",
      "scenario": {
        "user_id": "test_user_returning_003",
        "whatsapp": "56912345003",
        "prerequisite": {
          "action": "create_existing_prospecto",
          "data": {
            "whatsapp": "56912345003",
            "nombre": "Carlos Rodríguez", 
            "email": "carlos.rodriguez@test.com",
            "edad": 28,
            "region": "Valparaíso",
            "telefono": "965432100",
            "tipo_consulta": "info_carreras",
            "created_at": "2025-08-20T10:00:00Z"
          }
        },
        "steps": [
          {
            "step": 1,
            "action": "send_message",
            "message": "hola",
            "expected_response_contains": [
              "¡Hola de nuevo Carlos Rodríguez!",
              "Te reconocí por tu WhatsApp"
            ],
            "rpc_function_call": {
              "function": "get_usuario_recurrente",
              "parameters": ["56912345003", 30],
              "expected_result": {
                "found": true,
                "nombre": "Carlos Rodríguez",
                "es_reciente": true
              }
            }
          },
          {
            "step": 2,
            "action": "verify_contextual_menu",
            "expected_options": [
              "Nueva consulta diferente",
              "Seguir con info de carreras", 
              "Hablar con asesor",
              "Ver mis datos"
            ]
          },
          {
            "step": 3,
            "action": "send_message",
            "message": "2",
            "expected_response_contains": [
              "Perfecto, continuemos con información de carreras",
              "facultad te interesa más"
            ],
            "expected_state": "flujo_carreras/seleccionar_facultad"
          }
        ],
        "success_criteria": [
          "Usuario es reconocido automáticamente",
          "RPC get_usuario_recurrente() funciona correctamente", 
          "Menú contextual se presenta con opciones relevantes",
          "No se solicitan datos básicos nuevamente",
          "Estado fluye correctamente a flujo específico"
        ]
      }
    },

    "anti-duplicates-validation": {
      "name": "Sistema Anti-Duplicados - Validación",
      "description": "Test que verifica que no se crean prospectos duplicados",
      "scenario": {
        "user_id": "test_anti_duplicates_004", 
        "whatsapp": "56912345004",
        "steps": [
          {
            "step": 1,
            "action": "complete_full_capture",
            "data": {
              "nombre": "Ana Silva",
              "email": "ana.silva@test.com", 
              "edad": 22,
              "region": "Biobío",
              "telefono": "932100987"
            },
            "expected_result": "prospecto_created"
          },
          {
            "step": 2,
            "action": "select_menu_option",
            "option": "1",
            "flow": "info_carreras",
            "complete_flow": true,
            "expected_database_action": "update_existing_prospecto"
          },
          {
            "step": 3,
            "action": "send_message", 
            "message": "hola",
            "expected_response_contains": ["Escribe 'Hola' para comenzar con una nueva consulta"]
          },
          {
            "step": 4,
            "action": "send_message",
            "message": "hola", 
            "expected_result": "recognized_as_returning_user"
          }
        ],
        "rpc_validation": {
          "function": "upsert_prospecto_por_whatsapp",
          "test_cases": [
            {
              "scenario": "prospecto_reciente_existe", 
              "parameters": {
                "p_whatsapp": "56912345004",
                "p_nombre": "Ana Silva Duplicate",
                "p_horas_limite": 24
              },
              "expected_result": {
                "es_nuevo": false,
                "mensaje": "Prospecto existente encontrado (anti-duplicados)"
              }
            }
          ]
        },
        "success_criteria": [
          "Solo 1 prospecto creado para mismo WhatsApp",
          "RPC anti-duplicados funciona correctamente",
          "Múltiples flujos actualizan mismo prospecto", 
          "Reset de estado funciona entre consultas",
          "Reconocimiento funciona en consultas posteriores"
        ]
      }
    },

    "asesor-urgente-flow": {
      "name": "Flujo Asesor - Prioridad Urgente",
      "description": "Test del flujo crítico de solicitud de asesor con prioridad urgente",
      "scenario": {
        "user_id": "test_asesor_urgente_005",
        "whatsapp": "56912345005", 
        "steps": [
          {
            "step": 1,
            "action": "complete_basic_capture", 
            "data": {
              "nombre": "Pedro Morales",
              "email": "pedro.morales@test.com",
              "edad": 30,
              "region": "Antofagasta", 
              "telefono": "945678123"
            }
          },
          {
            "step": 2,
            "action": "send_message",
            "message": "5",
            "expected_response_contains": [
              "📞 ¡Perfecto! Quieres hablar con uno de nuestros asesores",
              "En breve un asesor se contactará contigo"
            ],
            "expected_state": "flujo_asesor/solicitud_completada"
          },
          {
            "step": 3,
            "action": "verify_database_update",
            "expected_updates": {
              "table": "prospectos",
              "conditions": {
                "whatsapp": "56912345005",
                "tipo_consulta": "solicitud de asesor",
                "nivel_interes": "urgente",
                "fuente": "asesor_request"
              }
            }
          },
          {
            "step": 4,
            "action": "verify_webhook_call",
            "expected_webhook": {
              "url": "http://localhost:3002/api/botpress-webhook",
              "payload_contains": {
                "source": "asesor_request",
                "flujo_actual": "hablar_asesor",
                "estado": "nuevo"
              }
            }
          }
        ],
        "dashboard_verification": [
          {
            "action": "check_dashboard_ui",
            "url": "http://localhost:3000",
            "expected_elements": [
              "Badge 'URGENTE' visible",
              "Prospecto aparece en filtro prioridad alta",
              "Timestamp de solicitud correcto"
            ]
          }
        ],
        "success_criteria": [
          "Prospecto marcado con nivel_interes = 'urgente'",
          "tipo_consulta = 'solicitud de asesor'", 
          "Webhook enviado correctamente al dashboard",
          "Dashboard muestra prospecto con prioridad visual",
          "Fuente marcada como 'asesor_request'"
        ]
      }
    },

    "error-recovery-scenarios": {
      "name": "Escenarios de Recuperación de Errores",
      "description": "Test de manejo de errores y recuperación del sistema",
      "scenarios": [
        {
          "name": "supabase_connection_error",
          "steps": [
            {
              "action": "simulate_db_error",
              "error_type": "connection_timeout"
            },
            {
              "action": "send_message", 
              "message": "hola",
              "expected_response_contains": [
                "sistema está experimentando dificultades",
                "intenta nuevamente en unos minutos"
              ]
            }
          ]
        },
        {
          "name": "rpc_function_failure",
          "steps": [
            {
              "action": "simulate_rpc_error",
              "function": "upsert_prospecto_por_whatsapp"
            },
            {
              "action": "complete_capture_flow",
              "expected_fallback": "local_storage_backup"
            }
          ]
        }
      ]
    }
  }
}