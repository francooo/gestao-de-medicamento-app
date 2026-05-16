# Gentle Care — Documento de Planejamento

> Guia completo de funcionalidades, estado atual, requisitos de banco de dados e roadmap de desenvolvimento do aplicativo Gentle Care.

---

## 1. Visão Geral do Aplicativo

**Gentle Care** é um aplicativo mobile para rastreamento de medicamentos, doses e dados de saúde de membros da família. Ele permite que cuidadores — pais, responsáveis ou familiares — gerenciem o tratamento de múltiplos pacientes em um único lugar, com segurança e praticidade.

### Público-alvo
- Pais com filhos em tratamento medicamentoso
- Cuidadores de idosos ou pessoas com doenças crônicas
- Famílias que precisam coordenar o cuidado de múltiplos membros

### Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|-----------|
| Mobile | Expo React Native (SDK 54) |
| Navegação | Expo Router (file-based routing) |
| Armazenamento local | AsyncStorage |
| Backend | Express.js (Node.js) |
| ORM / Banco | Drizzle ORM + PostgreSQL |
| Animações | React Native Reanimated |
| Ícones | @expo/vector-icons (Ionicons, MaterialCommunityIcons) |
| Feedback tátil | expo-haptics |
| Fontes | Inter (400, 500, 600, 700) via @expo-google-fonts |

---

## 2. Funcionalidades Existentes (Implementadas)

### 2.1 Tela de Boas-vindas (`app/welcome.tsx`)
- Exibe logo e slogan do app
- Botão "Continuar com Google" (login simulado)
- Campo de e-mail com botão "Entrar" (login simulado)
- Link "Criar uma conta" (redireciona para login simulado)
- Suporte a modo claro e escuro

### 2.2 Painel Principal — Home (`app/(tabs)/index.tsx`)
- **Saudação dinâmica** por horário do dia (Bom Dia / Boa Tarde / Boa Noite)
- **Seletor de perfil** horizontal com avatares por iniciais e cores personalizadas
- **Card de próxima dose**: exibe o medicamento mais urgente com badge "Agora" ou "Em Xh"
- **Botão "Registrar"** que abre o Registrador de Dose diretamente
- **Widget de Peso**: mostra o peso atual do perfil selecionado, data da última verificação e um gráfico sparkline decorativo
- **Widget de Próximo**: exibe o segundo medicamento pendente com frequência
- **Resumo de ontem**: card indicando se todas as doses foram registradas no dia anterior
- **Botão flutuante (FAB)** para adicionar novo medicamento

### 2.3 Armário de Remédios (`app/(tabs)/cabinet.tsx`)
- Lista todos os medicamentos do perfil selecionado
- Cada card exibe: nome, concentração, intervalo, tipo (ícone), e observações
- Botão **"Registrar"** por medicamento (abre o Registrador de Dose)
- Botão de **exclusão** com confirmação em Alert nativo
- Banner com nome e peso do perfil selecionado
- Estado vazio com call-to-action para adicionar o primeiro medicamento
- Contador de medicamentos no topo da lista

### 2.4 Histórico (`app/(tabs)/history.tsx`)
- Lista cronológica de todos os registros (dose, peso, temperatura, nota)
- **Agrupamento por data** (Hoje, Ontem, dia da semana, data completa)
- **Filtro por perfil** com chips horizontais
- Ícones diferenciados por tipo de registro
- Alerta visual para temperaturas acima de 38°C
- Botão **"Compartilhar com Médico"** (sem implementação real)
- Texto de fim de histórico ao final da lista

### 2.5 Registrador de Dose (`app/dose-logger.tsx`)
- Seletor de quantidade por **stepper** (botões + e −) com suporte a unidades (ml, mg, drops, mcg, units)
- **Seletor de horário**: opções rápidas (Agora, 15min atrás, 30min atrás, 1h atrás)
- **Exibição do peso atual** do perfil com faixa de dose segura calculada
- Botão "Atualizar" para redirecionar à Verificação de Peso
- **Verificação de segurança automática**: se a dose foi dada antes do intervalo mínimo, redireciona para a tela de alerta
- Botão **"Salvar Registro"** que persiste o log no AsyncStorage
- Informação de próxima dose (em horas)

### 2.6 Verificação de Segurança (`app/safety-check.tsx`)
- Exibida quando uma dose é registrada antes do intervalo mínimo passar
- Mostra o nome do medicamento e o intervalo requerido
- Opções: **"Cancelar e Aguardar"** ou **"Registrar Mesmo Assim"**

### 2.7 Verificação de Peso (`app/weight-check.tsx`)
- Campo numérico para atualizar o peso do paciente
- Exibe o peso anterior registrado
- Aviso de segurança sobre a importância da precisão
- Botão **"Calcular Dose Segura"** que salva o peso e redireciona ao Registrador de Dose

### 2.8 Insight do Medicamento (`app/medication-insight.tsx`)
- Badge **"Resumo IA"** (dados hardcoded)
- **Card de Dose Segura Calculada**: faixa mínima e máxima com base no peso do perfil (4,5–5 mg/kg)
- Exibe frequência e duração do tratamento
- Seção **"Atenção"** com alertas específicos por medicamento (apenas Amoxicillin e Ibuprofen têm dados)
- Botão **"Ler bula oficial (PDF)"** (sem implementação)
- Botão **"Entendi, Obrigado"** para fechar

### 2.9 Adicionar Medicamento (`app/add-medication.tsx`)
- Banner com perfil atual selecionado
- Hero **"Escanear Rótulo"** com badge "IA ATIVADA" (apenas estético)
- Formulário completo: nome, tipo (Líquido/Comprimido/Outro), concentração, unidade, intervalo em horas, duração em dias, instruções/observações
- Validação: botão "Salvar" desabilitado até nome e concentração serem preenchidos
- Persiste o medicamento no AsyncStorage

### 2.10 Navegação
- **3 abas** com ícones: Início, Armário, Histórico
- Suporte a **Liquid Glass** no iOS 26+
- Stack de modais para: Registrador de Dose, Adicionar Medicamento, Insight, Verificação de Peso, Verificação de Segurança

---

## 3. Estado Atual do Armazenamento de Dados

O app usa exclusivamente **AsyncStorage** (armazenamento local no dispositivo) para toda a persistência de dados. Não há comunicação com nenhum servidor ou banco de dados externo.

### Chaves do AsyncStorage

| Chave | Conteúdo |
|-------|---------|
| `gc_profiles` | Lista de perfis da família (JSON) |
| `gc_selected_profile` | ID do perfil selecionado atualmente |
| `gc_medications` | Lista de todos os medicamentos (JSON) |
| `gc_dose_logs` | Histórico completo de registros (JSON) |
| `gc_authenticated` | Estado de autenticação ("true" / "false") |

### Estrutura dos Dados

**Perfil (`Profile`)**
```
id, name, weight, weightVerifiedAt, avatarColor
```

**Medicamento (`Medication`)**
```
id, profileId, name, type, strength, unit, notes, intervalHours, durationDays
```

**Registro (`DoseLog`)**
```
id, profileId, medicationId, medicationName, dose, unit, timestamp, type, value, note
```

### Limitações do AsyncStorage

- ❌ Dados perdidos ao desinstalar o app
- ❌ Sem sincronização entre dispositivos
- ❌ Sem acesso multi-usuário (pai e mãe não compartilham os mesmos dados)
- ❌ Sem backup automático
- ❌ Consultas complexas ineficientes (carrega tudo na memória)
- ❌ Sem histórico de longo prazo confiável

---

## 4. Infraestrutura de Backend Existente (Não Conectada)

O projeto já possui a base de um backend, mas ela **não está conectada ao app mobile**. Toda a comunicação de dados ainda passa pelo AsyncStorage local.

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `server/index.ts` | Servidor Express na porta 5000 com CORS, logging e serving estático | Funcionando |
| `server/routes.ts` | Registro de rotas da API | Vazio — sem nenhuma rota |
| `shared/schema.ts` | Schema Drizzle ORM com tabela `users` (id, username, password) | Apenas `users` |
| `lib/query-client.ts` | Cliente HTTP com TanStack Query, `apiRequest()` e `getQueryFn()` | Presente mas não utilizado |

O servidor Express serve a landing page na raiz (`/`) e arquivos estáticos do build do Expo. A variável de ambiente `EXPO_PUBLIC_DOMAIN` já aponta para o domínio do servidor, o que facilitará a integração futura.

---

## 5. Funcionalidades Simuladas / Não Implementadas

Estas funcionalidades têm presença na interface mas **não funcionam de verdade**:

| Funcionalidade | Onde | Situação Atual |
|---------------|------|---------------|
| **Login com e-mail** | `app/welcome.tsx` | Seta `gc_authenticated = true` e redireciona. Sem validação ou servidor |
| **Login com Google** | `app/welcome.tsx` | Idêntico ao e-mail. Sem OAuth real |
| **Escaneamento de rótulo com IA** | `app/add-medication.tsx` | Dispara apenas `Haptics.impactAsync`. Sem câmera ou OCR |
| **Resumo IA de medicamento** | `app/medication-insight.tsx` | Objeto `WATCH_OUTS` hardcoded para 2 medicamentos. Sem chamada a API de IA |
| **Bula oficial (PDF)** | `app/medication-insight.tsx` | Botão sem `onPress` funcional |
| **Compartilhar com médico** | `app/(tabs)/history.tsx` | Botão com haptic apenas. Sem geração de PDF ou compartilhamento |
| **Notificações de dose** | (ausente) | Nenhuma implementação de push notifications |
| **Adicionar perfil** | `app/(tabs)/index.tsx` | Botão "Adicionar" com haptic apenas. Sem tela de criação de perfil |
| **Sincronização entre dispositivos** | (ausente) | Inexistente |
| **Gráfico de peso real** | `app/(tabs)/index.tsx` | Sparkline SVG é decorativo, com dados fixos |

---

## 6. O Que Precisa de Banco de Dados Real

Para que as funcionalidades críticas funcionem corretamente, é necessário migrar para um backend com PostgreSQL via Drizzle ORM (infraestrutura já existente no projeto).

### 6.1 Autenticação Real de Usuários
**Por que precisa de banco:** Credenciais (e-mail + senha com hash bcrypt, tokens OAuth Google) precisam ser armazenadas com segurança em servidor. O AsyncStorage não pode guardar dados sensíveis de forma confiável.

- Tabela necessária: `users`
- Operações: cadastro, login, refresh de token JWT, logout

### 6.2 Perfis de Família por Conta
**Por que precisa de banco:** Perfis precisam estar vinculados a uma conta de usuário para sobreviver à reinstalação do app e serem acessíveis em múltiplos dispositivos.

- Tabela necessária: `profiles` (com `user_id` como chave estrangeira)

### 6.3 Compartilhamento de Perfil entre Cuidadores
**Por que precisa de banco:** Se pai e mãe usam o app separadamente, precisam enxergar os mesmos dados do filho. Isso requer uma tabela de membros com controle de permissão.

- Tabela necessária: `profile_members` (perfil + usuário + papel: dono/cuidador/visualizador)

### 6.4 Medicamentos Persistentes por Conta
**Por que precisa de banco:** Medicamentos devem sobreviver à troca de dispositivo e serem visíveis por todos os cuidadores autorizados.

- Tabela necessária: `medications` (com `profile_id`)

### 6.5 Histórico de Doses com Durabilidade
**Por que precisa de banco:** O histórico de saúde é dado crítico. Perder doses registradas ao desinstalar o app é inaceitável em contexto médico. Além disso, consultas avançadas (filtrar por período, exportar, calcular estatísticas) são inviáveis com AsyncStorage.

- Tabela necessária: `dose_logs` (com `profile_id`, `medication_id`, `timestamp`)

### 6.6 Push Notifications Agendadas
**Por que precisa de banco:** Lembretes de dose precisam ser disparados mesmo quando o app está fechado. Isso requer um servidor que agende e envie as notificações push (via Expo Push API ou Firebase).

- Tabela necessária: `push_tokens` (token do dispositivo por usuário e plataforma)

### 6.7 OCR e IA para Rótulo e Resumo
**Por que precisa de backend:** Chamadas a APIs de IA (OpenAI, Google Vision) devem passar pelo servidor para proteger as chaves de API. Não é seguro fazer essas chamadas diretamente do app.

- Rotas necessárias: `POST /api/medications/scan-label`, `POST /api/medications/insight`

### 6.8 Exportação de Relatório para Médico
**Por que precisa de backend:** A geração de PDFs formatados é uma operação pesada que deve ocorrer no servidor, não no dispositivo.

- Rota necessária: `GET /api/reports/export/:profileId`

---

## 7. Schema do Banco de Dados Proposto

### Tabela: `users`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `email` | TEXT UNIQUE | E-mail do usuário |
| `password_hash` | TEXT | Senha com bcrypt (nulo se usar OAuth) |
| `name` | TEXT | Nome do usuário |
| `avatar_url` | TEXT | Foto de perfil (opcional) |
| `created_at` | TIMESTAMP | Data de criação |

### Tabela: `profiles`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `user_id` | UUID (FK → users) | Proprietário do perfil |
| `name` | TEXT | Nome do membro da família |
| `weight` | DECIMAL | Peso em kg |
| `weight_verified_at` | TIMESTAMP | Quando o peso foi confirmado |
| `avatar_color` | TEXT | Cor do avatar em hex |
| `birth_date` | DATE | Data de nascimento (para cálculo por idade) |
| `created_at` | TIMESTAMP | Data de criação |

### Tabela: `profile_members`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `profile_id` | UUID (FK → profiles) | Perfil compartilhado |
| `user_id` | UUID (FK → users) | Usuário convidado |
| `role` | ENUM | `owner`, `caregiver`, `viewer` |
| `invited_at` | TIMESTAMP | Data do convite |

### Tabela: `medications`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `profile_id` | UUID (FK → profiles) | Perfil do paciente |
| `name` | TEXT | Nome do medicamento |
| `type` | ENUM | `liquid`, `tablet`, `other` |
| `strength` | DECIMAL | Concentração |
| `unit` | ENUM | `ml`, `mg`, `drops`, `mcg`, `units` |
| `notes` | TEXT | Instruções e observações |
| `interval_hours` | INTEGER | Intervalo mínimo entre doses |
| `duration_days` | INTEGER | Duração do tratamento |
| `created_at` | TIMESTAMP | Data de cadastro |

### Tabela: `dose_logs`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `profile_id` | UUID (FK → profiles) | Perfil do paciente |
| `medication_id` | UUID (FK → medications, nullable) | Medicamento relacionado |
| `medication_name` | TEXT | Nome (desnormalizado para histórico) |
| `dose` | DECIMAL | Quantidade administrada |
| `unit` | TEXT | Unidade da dose |
| `timestamp` | TIMESTAMP | Momento da administração |
| `type` | ENUM | `dose`, `weight`, `temperature`, `note` |
| `value` | DECIMAL | Valor para peso ou temperatura |
| `note` | TEXT | Texto livre para anotações |
| `logged_by_user_id` | UUID (FK → users) | Quem registrou |

### Tabela: `push_tokens`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `user_id` | UUID (FK → users) | Usuário dono do dispositivo |
| `token` | TEXT | Token Expo Push |
| `platform` | ENUM | `ios`, `android` |
| `created_at` | TIMESTAMP | Data de registro |

---

## 8. Roadmap de Funcionalidades a Construir

### Fase 1 — Backend e Autenticação *(Alta prioridade)*
Pré-requisito para tudo. Sem isso, o app não tem identidade de usuário.

1. Expandir o schema Drizzle com todas as tabelas propostas (Section 7)
2. Implementar rotas de autenticação: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`
3. Middleware de autenticação JWT para proteger rotas privadas
4. Integrar login com Google via OAuth 2.0
5. Conectar o app mobile ao backend via `lib/query-client.ts` (já configurado)
6. Migrar o estado de autenticação de AsyncStorage para token JWT

### Fase 2 — Sincronização de Dados *(Alta prioridade)*
Migra perfis, medicamentos e logs do AsyncStorage para a API.

1. Criar rotas CRUD: `/api/profiles`, `/api/medications`, `/api/logs`
2. Substituir as funções do `AppContext.tsx` por chamadas ao TanStack Query
3. Implementar cache local com sincronização em background (funcionar offline)
4. Migrar dados existentes do AsyncStorage para o servidor na primeira sincronização

### Fase 3 — Tela de Criação e Edição de Perfil *(Alta prioridade)*
Funcionalidade prometida pela UI mas não implementada.

1. Criar tela `app/add-profile.tsx` com formulário (nome, data de nascimento, peso, cor do avatar)
2. Conectar botão "Adicionar" na tela Home a essa nova tela
3. Permitir edição de perfil existente com tela `app/edit-profile.tsx`
4. Calcular automaticamente a faixa de dose por idade além de peso

### Fase 4 — Notificações e Lembretes *(Alta prioridade)*
Fundamental para que o app cumpra seu propósito de cuidado.

1. Registrar o token Expo Push do dispositivo no servidor ao fazer login
2. Criar job no servidor que calcula o próximo horário de dose de cada medicamento
3. Disparar notificação push quando a dose estiver próxima ou atrasada
4. Exibir resumo diário de doses pela manhã
5. Tela de configuração de lembretes por medicamento

### Fase 5 — IA e Automação *(Média prioridade)*
Transforma funcionalidades decorativas em recursos reais.

1. **Escaneamento de rótulo**: integrar câmera (`expo-image-picker`) e enviar imagem ao backend que chama a API do Google Vision ou OpenAI para OCR e preencher o formulário automaticamente
2. **Resumo IA real**: criar rota `/api/medications/insight` que chama a OpenAI com contexto do medicamento e peso do paciente, retornando alertas personalizados
3. **Bula oficial**: integrar com a base de dados da ANVISA ou Bulário Eletrônico para buscar e exibir a bula em PDF

### Fase 6 — Compartilhamento e Colaboração *(Média prioridade)*
Permite que múltiplos cuidadores acompanhem o mesmo paciente.

1. Tela de gerenciamento de cuidadores por perfil
2. Envio de convite por e-mail ou link
3. Feed em tempo real: notificar os cuidadores quando uma dose for registrada por outra pessoa
4. Controle de permissões (visualizador não pode adicionar medicamentos)

### Fase 7 — Relatórios e Exportação *(Média prioridade)*
Permite levar o histórico ao médico de forma profissional.

1. Gerar PDF do histórico de doses por perfil e período (backend)
2. Funcionalidade "Compartilhar com Médico" no histórico (abre share sheet nativo)
3. Gráficos reais de evolução de peso e temperatura ao longo do tempo
4. Estatísticas de adesão ao tratamento (doses administradas vs. esperadas)

### Fase 8 — Polimento e Funcionalidades Avançadas *(Baixa prioridade)*
Refinamentos para tornar o app mais completo.

1. Foto de avatar ou seleção de cor personalizada nos perfis
2. Histórico de variação de peso com gráfico real
3. Suporte a múltiplos idiomas além do português
4. Widget de tela inicial (iOS/Android) com próxima dose
5. Modo de emergência: exibir informações de dose sem autenticação

---

## 9. Tabela de Prioridade

| Funcionalidade | Impacto | Esforço | Prioridade |
|---------------|---------|---------|-----------|
| Backend + Autenticação real | 🔴 Crítico | Alto | 🥇 1ª |
| Sincronização de dados com API | 🔴 Crítico | Alto | 🥇 1ª |
| Tela de criação de perfil | 🔴 Alta | Médio | 🥈 2ª |
| Push notifications / Lembretes | 🔴 Alta | Alto | 🥈 2ª |
| Escaneamento de rótulo com IA | 🟡 Alta | Médio | 🥉 3ª |
| Resumo IA real por medicamento | 🟡 Média | Médio | 🥉 3ª |
| Compartilhamento entre cuidadores | 🟡 Alta | Alto | 🥉 3ª |
| Exportação de relatório em PDF | 🟢 Média | Médio | 4ª |
| Bula oficial (ANVISA) | 🟢 Média | Alto | 4ª |
| Gráficos de evolução de saúde | 🟢 Baixa | Médio | 5ª |
| Estatísticas de adesão | 🟢 Baixa | Baixo | 5ª |
| Widget de tela inicial | 🟢 Baixa | Alto | 6ª |

---

## 10. Arquivos-chave para Referência

| Arquivo | Responsabilidade |
|---------|----------------|
| `contexts/AppContext.tsx` | Estado global, AsyncStorage, toda a lógica de dados |
| `lib/query-client.ts` | Cliente HTTP TanStack Query pronto para uso |
| `server/index.ts` | Servidor Express com CORS, logging, serving estático |
| `server/routes.ts` | Ponto de entrada para registrar rotas da API (vazio) |
| `shared/schema.ts` | Schema Drizzle ORM (apenas tabela `users`) |
| `app/welcome.tsx` | Login — precisa de autenticação real |
| `app/(tabs)/index.tsx` | Home — perfis, próxima dose, widgets |
| `app/(tabs)/cabinet.tsx` | Lista de medicamentos por perfil |
| `app/(tabs)/history.tsx` | Histórico de registros com filtros |
| `app/dose-logger.tsx` | Registro de dose com cálculo de segurança |
| `app/add-medication.tsx` | Formulário + scan de rótulo com IA (stub) |
| `app/medication-insight.tsx` | Resumo IA + dose segura calculada |
| `app/safety-check.tsx` | Alerta de dose antecipada |
| `app/weight-check.tsx` | Atualização de peso antes do cálculo de dose |
