--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: approval_schemas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.approval_schemas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo_solicitud character varying(50) NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL,
    fecha_actualizacion timestamp without time zone DEFAULT now() NOT NULL,
    visibility_permissions text[],
    approval_permissions text[],
    tipos_permiso text[] DEFAULT '{Comunes,"Turno completo",Parciales}'::text[],
    adjuntar_documentos character varying(5) DEFAULT 'false'::character varying,
    comentario_requerido character varying(5) DEFAULT 'false'::character varying,
    enviar_correo_notificacion character varying(5) DEFAULT 'false'::character varying,
    permitir_solicitud_terceros character varying(5) DEFAULT 'false'::character varying,
    dias_minimo integer,
    dias_maximo integer,
    dias_multiplo integer,
    adjuntar_documentos_obligatorio character varying(5) DEFAULT 'false'::character varying,
    permitir_modificar_documentos character varying(5) DEFAULT 'false'::character varying,
    comentario_obligatorio character varying(5) DEFAULT 'false'::character varying,
    comentario_opcional character varying(5) DEFAULT 'true'::character varying,
    solicitud_creada character varying(5) DEFAULT 'false'::character varying,
    solicitud_aprobada_rechazada character varying(5) DEFAULT 'false'::character varying,
    motivos text[],
    tipo_dias character varying(20) DEFAULT 'calendario'::character varying
);


ALTER TABLE public.approval_schemas OWNER TO neondb_owner;

--
-- Name: approval_schemas_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.approval_schemas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.approval_schemas_id_seq OWNER TO neondb_owner;

--
-- Name: approval_schemas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.approval_schemas_id_seq OWNED BY public.approval_schemas.id;


--
-- Name: approval_steps; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.approval_steps (
    id integer NOT NULL,
    schema_id integer NOT NULL,
    orden integer NOT NULL,
    descripcion character varying(255) NOT NULL,
    perfil character varying(100) NOT NULL,
    obligatorio character varying(2) DEFAULT 'Si'::character varying NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.approval_steps OWNER TO neondb_owner;

--
-- Name: approval_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.approval_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.approval_steps_id_seq OWNER TO neondb_owner;

--
-- Name: approval_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.approval_steps_id_seq OWNED BY public.approval_steps.id;


--
-- Name: motivos_permisos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.motivos_permisos (
    id integer NOT NULL,
    categoria character varying(50) NOT NULL,
    motivo character varying(100) NOT NULL,
    activo character varying(5) DEFAULT 'true'::character varying,
    orden integer DEFAULT 0,
    fecha_creacion timestamp without time zone DEFAULT now(),
    fecha_actualizacion timestamp without time zone DEFAULT now()
);


ALTER TABLE public.motivos_permisos OWNER TO neondb_owner;

--
-- Name: motivos_permisos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.motivos_permisos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.motivos_permisos_id_seq OWNER TO neondb_owner;

--
-- Name: motivos_permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.motivos_permisos_id_seq OWNED BY public.motivos_permisos.id;


--
-- Name: request_approval_steps; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.request_approval_steps (
    id integer NOT NULL,
    request_id integer NOT NULL,
    approval_step_id integer NOT NULL,
    estado character varying(20) DEFAULT 'Pendiente'::character varying NOT NULL,
    aprobado_por character varying(100),
    comentario text,
    fecha_aprobacion timestamp without time zone,
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.request_approval_steps OWNER TO neondb_owner;

--
-- Name: request_approval_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.request_approval_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.request_approval_steps_id_seq OWNER TO neondb_owner;

--
-- Name: request_approval_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.request_approval_steps_id_seq OWNED BY public.request_approval_steps.id;


--
-- Name: request_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.request_history (
    id integer NOT NULL,
    request_id integer NOT NULL,
    previous_state character varying(20),
    new_state character varying(20) NOT NULL,
    changed_by character varying(100) NOT NULL,
    change_reason text,
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.request_history OWNER TO neondb_owner;

--
-- Name: request_history_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.request_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.request_history_id_seq OWNER TO neondb_owner;

--
-- Name: request_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.request_history_id_seq OWNED BY public.request_history.id;


--
-- Name: requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.requests (
    id integer NOT NULL,
    tipo character varying(50) NOT NULL,
    fecha_solicitada character varying(100) NOT NULL,
    fecha_fin character varying(100),
    asunto text NOT NULL,
    descripcion text,
    estado character varying(20) DEFAULT 'Pendiente'::character varying NOT NULL,
    solicitado_por character varying(100) NOT NULL,
    motivo character varying(100),
    archivos_adjuntos text[],
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL,
    fecha_actualizacion timestamp without time zone DEFAULT now() NOT NULL,
    identificador character varying(50),
    dias_solicitados integer,
    dias_efectivos integer,
    usuario_solicitado character varying(100),
    identificador_usuario character varying(50),
    grupo character varying(100)
);


ALTER TABLE public.requests OWNER TO neondb_owner;

--
-- Name: requests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.requests_id_seq OWNER TO neondb_owner;

--
-- Name: requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.requests_id_seq OWNED BY public.requests.id;


--
-- Name: user_vacation_balance; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_vacation_balance (
    id integer NOT NULL,
    identificador character varying(20) NOT NULL,
    nombre_usuario character varying(100) NOT NULL,
    dias_disponibles integer DEFAULT 15 NOT NULL,
    fecha_actualizacion timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_vacation_balance OWNER TO neondb_owner;

--
-- Name: user_vacation_balance_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_vacation_balance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_vacation_balance_id_seq OWNER TO neondb_owner;

--
-- Name: user_vacation_balance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_vacation_balance_id_seq OWNED BY public.user_vacation_balance.id;


--
-- Name: approval_schemas id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.approval_schemas ALTER COLUMN id SET DEFAULT nextval('public.approval_schemas_id_seq'::regclass);


--
-- Name: approval_steps id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.approval_steps ALTER COLUMN id SET DEFAULT nextval('public.approval_steps_id_seq'::regclass);


--
-- Name: motivos_permisos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.motivos_permisos ALTER COLUMN id SET DEFAULT nextval('public.motivos_permisos_id_seq'::regclass);


--
-- Name: request_approval_steps id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.request_approval_steps ALTER COLUMN id SET DEFAULT nextval('public.request_approval_steps_id_seq'::regclass);


--
-- Name: request_history id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.request_history ALTER COLUMN id SET DEFAULT nextval('public.request_history_id_seq'::regclass);


--
-- Name: requests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.requests ALTER COLUMN id SET DEFAULT nextval('public.requests_id_seq'::regclass);


--
-- Name: user_vacation_balance id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_vacation_balance ALTER COLUMN id SET DEFAULT nextval('public.user_vacation_balance_id_seq'::regclass);


--
-- Data for Name: approval_schemas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.approval_schemas (id, nombre, tipo_solicitud, fecha_creacion, fecha_actualizacion, visibility_permissions, approval_permissions, tipos_permiso, adjuntar_documentos, comentario_requerido, enviar_correo_notificacion, permitir_solicitud_terceros, dias_minimo, dias_maximo, dias_multiplo, adjuntar_documentos_obligatorio, permitir_modificar_documentos, comentario_obligatorio, comentario_opcional, solicitud_creada, solicitud_aprobada_rechazada, motivos, tipo_dias) FROM stdin;
105	Test Vacaciones	Vacaciones	2025-07-09 13:32:54.316657	2025-07-09 13:32:54.316657	{#adminCuenta#}	{#adminCuenta#}	{Comunes,"Turno completo",Parciales}	false	false	false	false	\N	\N	\N	false	false	false	true	false	false	{Vacaciones}	calendario
106	Test permisos médicos	Permiso	2025-07-09 13:39:53.07721	2025-07-09 13:46:14.415	{#adminCuenta#,#usuario#}	{}	{Comunes,"Turno completo",Parciales}	true	false	false	false	\N	\N	\N	true	false	false	true	false	false	{"Consulta medica","Accidente laboral","Baja Médica"}	calendario
107	Funeral x.x	Permiso	2025-07-09 14:08:13.911177	2025-07-09 14:08:48.214	{#JefeGrupo#,#ReporteLegal#,#adminCuenta#,#supervisor#,#usuario#,Prueba}	{}	{Comunes,"Turno completo",Parciales}	true	false	false	false	\N	\N	\N	false	false	false	true	false	false	{"P. Fallecimiento"}	calendario
108	Herido	Permiso	2025-07-09 19:08:08.054931	2025-07-09 19:08:26.738	{#JefeGrupo#,#ReporteLegal#,#adminCuenta#,#supervisor#,#usuario#,Prueba}	{}	{Comunes,"Turno completo",Parciales}	false	false	false	false	\N	\N	\N	false	false	false	true	false	false	{"Licencia Médica Estándar"}	calendario
109	All optional	Permiso	2025-07-09 19:13:23.572586	2025-07-09 19:13:49.756	{#JefeGrupo#,#ReporteLegal#,#adminCuenta#,#supervisor#,#usuario#,Prueba}	{}	{Comunes,"Turno completo",Parciales}	false	false	false	false	\N	\N	\N	false	false	false	true	false	false	{prueba}	calendario
\.


--
-- Data for Name: approval_steps; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.approval_steps (id, schema_id, orden, descripcion, perfil, obligatorio, fecha_creacion) FROM stdin;
104	109	3	paso 3	#adminCuenta#	No	2025-07-09 19:13:40.672035
103	109	2	paso 2	#supervisor#	No	2025-07-09 19:13:36.412018
97	106	1	paso 1	#adminCuenta#	Si	2025-07-09 13:41:15.987391
98	107	1	paso 1	#supervisor#	Si	2025-07-09 14:08:23.851033
99	107	2	paso 2	#adminCuenta#	Si	2025-07-09 14:08:32.861984
100	108	1	paso 1	#adminCuenta#	Si	2025-07-09 19:08:14.855483
\.


--
-- Data for Name: motivos_permisos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.motivos_permisos (id, categoria, motivo, activo, orden, fecha_creacion, fecha_actualizacion) FROM stdin;
\.


--
-- Data for Name: request_approval_steps; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.request_approval_steps (id, request_id, approval_step_id, estado, aprobado_por, comentario, fecha_aprobacion, fecha_creacion) FROM stdin;
177	206	97	Pendiente	\N	\N	\N	2025-07-09 13:46:03.379703
179	208	97	Aprobado	#adminCuenta#	\N	2025-07-09 13:49:30.751	2025-07-09 13:47:06.634641
178	207	97	Aprobado	#adminCuenta#	ok	2025-07-09 13:49:48.782	2025-07-09 13:46:46.483322
180	209	98	Aprobado	#supervisor#	Aprobación masiva: Aprobado	2025-07-09 14:09:57.604	2025-07-09 14:09:24.705623
181	209	99	Aprobado	#adminCuenta#	Aprobación masiva: Aprobado	2025-07-09 14:10:15.51	2025-07-09 14:09:24.755889
182	210	98	Aprobado	#supervisor#	Aprobación masiva: Aprobado	2025-07-09 19:05:25.745	2025-07-09 19:05:09.178134
183	210	99	Aprobado	#adminCuenta#	Aprobación masiva: Aprobado	2025-07-09 19:06:01.035	2025-07-09 19:05:09.235165
184	211	100	Aprobado	#adminCuenta#	Aprobación masiva: Aprobado	2025-07-09 19:09:36.822	2025-07-09 19:09:07.695979
\.


--
-- Data for Name: request_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.request_history (id, request_id, previous_state, new_state, changed_by, change_reason, fecha_creacion) FROM stdin;
418	206	\N	Pendiente	Juan Luis Renedo Gutierrez	Solicitud creada	2025-07-09 13:46:03.243659
419	206	\N	Pendiente	Juan Luis Renedo Gutierrez	Solicitud creada	2025-07-09 13:46:03.427322
420	207	\N	Pendiente	Juan Luis Renedo Gutierrez	Solicitud creada	2025-07-09 13:46:46.349163
421	207	\N	Pendiente	Juan Luis Renedo Gutierrez	Solicitud creada	2025-07-09 13:46:46.527539
422	208	\N	Pendiente	Andrés Acevedo	Solicitud creada	2025-07-09 13:47:06.497336
423	208	\N	Pendiente	Andrés Acevedo	Solicitud creada	2025-07-09 13:47:06.679318
424	208	\N	Aprobado	#adminCuenta#	Paso aprobado por #adminCuenta#	2025-07-09 13:49:30.815714
425	207	\N	Aprobado	#adminCuenta#	ok	2025-07-09 13:49:48.848172
426	209	\N	Pendiente	Prueba GC	Solicitud creada	2025-07-09 14:09:24.567457
427	209	\N	Pendiente	Prueba GC	Solicitud creada	2025-07-09 14:09:24.809711
428	209	\N	Aprobado	#supervisor#	Aprobación masiva: Aprobado	2025-07-09 14:09:57.7025
429	209	\N	Aprobado	#adminCuenta#	Aprobación masiva: Aprobado	2025-07-09 14:10:15.572605
430	209	Pendiente	Aprobado	Sistema de aprobación	Todos los pasos obligatorios completados	2025-07-09 14:10:15.759692
431	210	\N	Pendiente	Prueba GC	Solicitud creada	2025-07-09 19:05:09.03584
432	210	\N	Pendiente	Prueba GC	Solicitud creada	2025-07-09 19:05:09.2816
433	210	\N	Aprobado	#supervisor#	Aprobación masiva: Aprobado	2025-07-09 19:05:25.817563
434	210	\N	Aprobado	#adminCuenta#	Aprobación masiva: Aprobado	2025-07-09 19:06:01.095956
435	210	Pendiente	Aprobado	Sistema de aprobación	Todos los pasos obligatorios completados	2025-07-09 19:06:01.279139
436	211	\N	Pendiente	Prueba GC	Solicitud creada	2025-07-09 19:09:07.566524
437	211	\N	Pendiente	Prueba GC	Solicitud creada	2025-07-09 19:09:07.739866
438	211	\N	Aprobado	#adminCuenta#	Aprobación masiva: Aprobado	2025-07-09 19:09:36.890121
439	211	Pendiente	Aprobado	Sistema de aprobación	Todos los pasos obligatorios completados	2025-07-09 19:09:37.061753
\.


--
-- Data for Name: requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.requests (id, tipo, fecha_solicitada, fecha_fin, asunto, descripcion, estado, solicitado_por, motivo, archivos_adjuntos, fecha_creacion, fecha_actualizacion, identificador, dias_solicitados, dias_efectivos, usuario_solicitado, identificador_usuario, grupo) FROM stdin;
210	Permiso	2025-07-12	2025-07-12	Solicitud de Permiso	test 1	Aprobado	Prueba GC	P. Fallecimiento	{}	2025-07-09 19:05:08.964082	2025-07-09 19:06:01.216	20836784	\N	\N	Prueba GC	20836784	Concón
211	Permiso	2025-07-13		Solicitud de Permiso		Aprobado	Prueba GC	Licencia Médica Estándar	{}	2025-07-09 19:09:07.52291	2025-07-09 19:09:37.002	20836784	\N	\N	Prueba GC	20836784	Concón
206	Permiso	2025-07-01	2025-07-01	Solicitud de Permiso		Pendiente	Juan Luis Renedo Gutierrez	Accidente laboral	{}	2025-07-09 13:46:03.161947	2025-07-09 13:46:03.161947	12765586	\N	\N	Juan Luis Renedo Gutierrez	12765586	\N
208	Permiso	2025-07-01	2025-07-01	Solicitud de Permiso		Aprobado	Andrés Acevedo	Accidente laboral	{74HAAAAAAAAAA-6.pdf}	2025-07-09 13:47:06.452544	2025-07-09 13:49:30.889	12765586	\N	\N	Juan Luis Renedo Gutierrez	12765586	\N
207	Permiso	2025-07-10	2025-07-10	Solicitud de Permiso		Aprobado	Juan Luis Renedo Gutierrez	Accidente laboral	{74HAAAAAAAAAA-6.pdf}	2025-07-09 13:46:46.304798	2025-07-09 13:49:48.926	12765586	\N	\N	Juan Luis Renedo Gutierrez	12765586	\N
209	Permiso	2025-07-11	2025-07-11	Solicitud de Permiso		Aprobado	Prueba GC	P. Fallecimiento	{GLuAOyOXgAAxKSg.jpg}	2025-07-09 14:09:24.514371	2025-07-09 14:10:15.695	20836784	\N	\N	Prueba GC	20836784	Concón
\.


--
-- Data for Name: user_vacation_balance; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_vacation_balance (id, identificador, nombre_usuario, dias_disponibles, fecha_actualizacion) FROM stdin;
\.


--
-- Name: approval_schemas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.approval_schemas_id_seq', 109, true);


--
-- Name: approval_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.approval_steps_id_seq', 104, true);


--
-- Name: motivos_permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.motivos_permisos_id_seq', 25, true);


--
-- Name: request_approval_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.request_approval_steps_id_seq', 184, true);


--
-- Name: request_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.request_history_id_seq', 439, true);


--
-- Name: requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.requests_id_seq', 211, true);


--
-- Name: user_vacation_balance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_vacation_balance_id_seq', 3, true);


--
-- Name: approval_schemas approval_schemas_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.approval_schemas
    ADD CONSTRAINT approval_schemas_pkey PRIMARY KEY (id);


--
-- Name: approval_steps approval_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.approval_steps
    ADD CONSTRAINT approval_steps_pkey PRIMARY KEY (id);


--
-- Name: motivos_permisos motivos_permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.motivos_permisos
    ADD CONSTRAINT motivos_permisos_pkey PRIMARY KEY (id);


--
-- Name: request_approval_steps request_approval_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.request_approval_steps
    ADD CONSTRAINT request_approval_steps_pkey PRIMARY KEY (id);


--
-- Name: request_history request_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.request_history
    ADD CONSTRAINT request_history_pkey PRIMARY KEY (id);


--
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- Name: user_vacation_balance user_vacation_balance_identificador_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_vacation_balance
    ADD CONSTRAINT user_vacation_balance_identificador_unique UNIQUE (identificador);


--
-- Name: user_vacation_balance user_vacation_balance_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_vacation_balance
    ADD CONSTRAINT user_vacation_balance_pkey PRIMARY KEY (id);


--
-- Name: approval_steps approval_steps_schema_id_approval_schemas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.approval_steps
    ADD CONSTRAINT approval_steps_schema_id_approval_schemas_id_fk FOREIGN KEY (schema_id) REFERENCES public.approval_schemas(id);


--
-- Name: request_approval_steps request_approval_steps_approval_step_id_approval_steps_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.request_approval_steps
    ADD CONSTRAINT request_approval_steps_approval_step_id_approval_steps_id_fk FOREIGN KEY (approval_step_id) REFERENCES public.approval_steps(id);


--
-- Name: request_approval_steps request_approval_steps_request_id_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.request_approval_steps
    ADD CONSTRAINT request_approval_steps_request_id_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.requests(id) ON DELETE CASCADE;


--
-- Name: request_history request_history_request_id_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.request_history
    ADD CONSTRAINT request_history_request_id_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.requests(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

