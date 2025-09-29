--
-- PostgreSQL database dump
--

-- Dumped from database version 10.23
-- Dumped by pg_dump version 10.23

-- Started on 2025-09-20 03:35:10 UTC

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

DROP DATABASE IF EXISTS cloudedze;
--
-- TOC entry 2269 (class 1262 OID 16384)
-- Name: cloudedze; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE cloudedze WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8';


ALTER DATABASE cloudedze OWNER TO postgres;

\connect cloudedze

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

--
-- TOC entry 1 (class 3079 OID 12333)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2272 (class 0 OID 0)
-- Dependencies: 1
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 200 (class 1259 OID 16427)
-- Name: cloud_credentials; Type: TABLE; Schema: public; Owner: cloud_cost_user
--

CREATE TABLE public.cloud_credentials (
    id integer NOT NULL,
    user_id integer,
    provider character varying(50) NOT NULL,
    credentials jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    encrypted_credentials text NOT NULL,
    name character varying(255),
    is_validated boolean DEFAULT false
);


ALTER TABLE public.cloud_credentials OWNER TO cloud_cost_user;

--
-- TOC entry 199 (class 1259 OID 16425)
-- Name: cloud_credentials_id_seq; Type: SEQUENCE; Schema: public; Owner: cloud_cost_user
--

CREATE SEQUENCE public.cloud_credentials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cloud_credentials_id_seq OWNER TO cloud_cost_user;

--
-- TOC entry 2273 (class 0 OID 0)
-- Dependencies: 199
-- Name: cloud_credentials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cloud_cost_user
--

ALTER SEQUENCE public.cloud_credentials_id_seq OWNED BY public.cloud_credentials.id;


--
-- TOC entry 204 (class 1259 OID 16463)
-- Name: cost_analyses; Type: TABLE; Schema: public; Owner: cloud_cost_user
--

CREATE TABLE public.cost_analyses (
    id integer NOT NULL,
    user_id integer,
    analysis_name character varying(255) NOT NULL,
    configuration jsonb NOT NULL,
    results jsonb NOT NULL,
    total_cost numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cost_analyses OWNER TO cloud_cost_user;

--
-- TOC entry 203 (class 1259 OID 16461)
-- Name: cost_analyses_id_seq; Type: SEQUENCE; Schema: public; Owner: cloud_cost_user
--

CREATE SEQUENCE public.cost_analyses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cost_analyses_id_seq OWNER TO cloud_cost_user;

--
-- TOC entry 2274 (class 0 OID 0)
-- Dependencies: 203
-- Name: cost_analyses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cloud_cost_user
--

ALTER SEQUENCE public.cost_analyses_id_seq OWNED BY public.cost_analyses.id;


--
-- TOC entry 202 (class 1259 OID 16445)
-- Name: inventory_scans; Type: TABLE; Schema: public; Owner: cloud_cost_user
--

CREATE TABLE public.inventory_scans (
    id integer NOT NULL,
    user_id integer,
    scan_name character varying(255),
    provider character varying(50),
    resources jsonb,
    total_cost numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    scan_data jsonb,
    summary jsonb,
    scan_duration integer
);


ALTER TABLE public.inventory_scans OWNER TO cloud_cost_user;

--
-- TOC entry 201 (class 1259 OID 16443)
-- Name: inventory_scans_id_seq; Type: SEQUENCE; Schema: public; Owner: cloud_cost_user
--

CREATE SEQUENCE public.inventory_scans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.inventory_scans_id_seq OWNER TO cloud_cost_user;

--
-- TOC entry 2275 (class 0 OID 0)
-- Dependencies: 201
-- Name: inventory_scans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cloud_cost_user
--

ALTER SEQUENCE public.inventory_scans_id_seq OWNED BY public.inventory_scans.id;


--
-- TOC entry 196 (class 1259 OID 16392)
-- Name: sessions; Type: TABLE; Schema: public; Owner: cloud_cost_user
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO cloud_cost_user;

--
-- TOC entry 2276 (class 0 OID 0)
-- Dependencies: 196
-- Name: TABLE sessions; Type: COMMENT; Schema: public; Owner: cloud_cost_user
--

COMMENT ON TABLE public.sessions IS 'User session data for authentication';


--
-- TOC entry 2277 (class 0 OID 0)
-- Dependencies: 196
-- Name: COLUMN sessions.sid; Type: COMMENT; Schema: public; Owner: cloud_cost_user
--

COMMENT ON COLUMN public.sessions.sid IS 'Session ID';


--
-- TOC entry 2278 (class 0 OID 0)
-- Dependencies: 196
-- Name: COLUMN sessions.sess; Type: COMMENT; Schema: public; Owner: cloud_cost_user
--

COMMENT ON COLUMN public.sessions.sess IS 'Session data as JSON';


--
-- TOC entry 2279 (class 0 OID 0)
-- Dependencies: 196
-- Name: COLUMN sessions.expire; Type: COMMENT; Schema: public; Owner: cloud_cost_user
--

COMMENT ON COLUMN public.sessions.expire IS 'Session expiration timestamp';


--
-- TOC entry 198 (class 1259 OID 16412)
-- Name: users; Type: TABLE; Schema: public; Owner: cloud_cost_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    profile_image_url character varying(500)
);


ALTER TABLE public.users OWNER TO cloud_cost_user;

--
-- TOC entry 197 (class 1259 OID 16410)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: cloud_cost_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO cloud_cost_user;

--
-- TOC entry 2280 (class 0 OID 0)
-- Dependencies: 197
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cloud_cost_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 2108 (class 2604 OID 16430)
-- Name: cloud_credentials id; Type: DEFAULT; Schema: public; Owner: cloud_cost_user
--

ALTER TABLE ONLY public.cloud_credentials ALTER COLUMN id SET DEFAULT nextval('public.cloud_credentials_id_seq'::regclass);


--
-- TOC entry 2115 (class 2604 OID 16466)
-- Name: cost_analyses id; Type: DEFAULT; Schema: public; Owner: cloud_cost_user
--

ALTER TABLE ONLY public.cost_analyses ALTER COLUMN id SET DEFAULT nextval('public.cost_analyses_id_seq'::regclass);


--
-- TOC entry 2112 (class 2604 OID 16448)
-- Name: inventory_scans id; Type: DEFAULT; Schema: public; Owner: cloud_cost_user
--

ALTER TABLE ONLY public.inventory_scans ALTER COLUMN id SET DEFAULT nextval('public.inventory_scans_id_seq'::regclass);


--
-- TOC entry 2105 (class 2604 OID 16415)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: cloud_cost_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 2259 (class 0 OID 16427)
-- Dependencies: 200
-- Data for Name: cloud_credentials; Type: TABLE DATA; Schema: public; Owner: cloud_cost_user
--

COPY public.cloud_credentials (id, user_id, provider, credentials, created_at, updated_at, encrypted_credentials, name, is_validated) FROM stdin;
10	3	oci	\N	2025-09-13 13:44:16.334468	2025-09-13 13:44:16.334468	f9e18c1fafa6d142f56429f4cc1518f8:141d13948f541748fe26d3b2887ae1e32d1164754836d5a0d5ae7cafd1830193b14fd9fe7bc31009ecae9abe5de70e2d280273f911ab96428ffc3977d9c33e707b828e3dc94e57d6cd318e0abf67df7dfa9e5655db3ab17823352a8cdfe32ae6cc75163d31f45dce00df24884f6161845caaf20b1a3ecbf658ed8f06570cf0feccb506a78a78780115eb52dfe871d341ca70c4dae91435d4416e77fb7b6582223f6e3a14c486a3c22f55b7f3109c02e875284d4a2f07f44911f3fa52acd1c7bd07ee7b99ef79eed8053365d6c665f558df08247084d27b1551216ff1f34e1ed60ed977f8e295775f11bb4d6dca12c6b1a79cef88f69c01d56aaf47d3350ccd7e2cd14fe9b96bd2a9181b7cbc5bba0b530d25d3b3b4a69f64b921928b1f710505243fc1559b8e9785ae78adde5db0c9cd9562ffc61be86460ade789a37743ae87b8181bc269d3d04f0a5110e7a9091afbd9a5ed1c5645ddaad3ed5791f589630cd496f60aca0832dac83503945b6416925442e8e9fef1da9cac6e114417de163199fe7e899a0f835bad8f7011a228c3676e7384238e956573e4d9bb98aa8a6eeba6ba976bed21dfee52ea5e06fbcf522a919638fad6b80eb71fb8da1fa57dcdc8f731cc8fe9443d0b4c8f51ab515bf826cefad364564548f8a5f8cf1c8c2235dd0368461b684dae936f66263d151b82a4b67354a82741e2ef3f022ab49e3eac1e095698fc30e5681c39269ac269e097d51cc6bf20dd61edb526b4b10f209b68ef1777ac3fbe30bbde9437c7dab70009947a94fd27ba54b64f559b5f94ce0c82b9c3ba0d323a6a482a6e2b001157a1b3ab3f2c54da204ece385076b8e93b9bcee41a65ae7e9d4c63f9f74325728cc7f3962d4281b988f35aeeb2deb15fc9d0221b4dfe743f9bc0a9320add3aff0d16da9b8a15ab348589592ebfcf6b7faf0ea9275ad1998b6b868c45918d9192286ff29217b4fb8318b29b4816dfb3cdf52fae2f5eb6a953746969d9809658c4cba211ddd99a78810a313ff9c0803d407d0cc83cfe316d22b7dd61aadef70ad37a7a86b55be2f26877c71fbecaae6a571ea66e5a6056580908c46f758634dd722281aef22f8bce7b32e393c89ef8f102b5e8f10e3f03c8709e1b439e645b4ea87d097bfe50adf4f2f48690e55c8cea66bdc5edfcd9ab931d8aab800cc070791f867eebd028135d4a84f00174fdf2f0dbe94373196cdf6abf27c37ea2b639a788ebd42a8e56314a8bf3c060009c75e4a79dffcb9de83b9f5ac8bbd5b5b3e190f59188bf6a9073d0aeeff30f2b3c2476ffbbb43b7d70ea50e2b7a126b5e68d0ab13785fe80413e679812cb3491c99420ec6716bece79b99afc6b237796990ba9032c989606b1eb43310b671d3c57576edda31003de04d1733b278428cd50d1336cfa8f210d5234398a9f25e9c4c8b9e48d1a18efdd66d253b810f4337257ef73c2965826a8e2fa6c48b1d4bf4546307fd92f9c72286a83ce2e5f77fdcf32e66e4c7d06b34f77707a6bacf1262d0ef5211f34e50ae083455e150a4d7d34fb36bbb8377c1fd0062272393ad6a43b5f5e6d78bbe2b19048fea2c8de80c790b4e057c9caa8153c07dad92724adccf7d3f7fdc8f9194d71ce7b9741f50ac338b36f90882855f73db280f690678c9846c92eb0743d3c093322cbb589f1f9cf8e244a47e132b388fe58df30ccb35a554a7cf0e6ce0481ec5aa722c6999d11e3f0c3a579f388bbfb1c1c199630e0535041314a30a022f5aa8ec763bd4e2972c91a97255d86b4824fd1f1a4578bf6f1ee7f781e17bfbba79372bdca37fc61576ec5a09c916e698bdda951d8a1aff38d7743702808f9bfa8d195383693d129beb5e94e1ee828e306894f3e80f649222c825c09da4dc00408f974bd17b716c0611df9ba755b7f5d80b851e66f6fd94130aa1d982b15b8d8028e5aa73da82e679b6159c28b4b5e0ad00d4915c2c7f56745580e6ec937bf1553ef3e18a2338334091aaad543d116c322d51c24c4a06f9fd149f446d55b7fbd337383381b95a3107c97065ef04c0f348ead907a491f2cf99633d66ff6252254b6e19b6d15e1cbaa638c2e3367482c6fddad42d52a43ccfc5c40238b6af2b98da5647dbf72d306b101b431faabe2aee9502ded7d6c1c4baef9a75d1a82b8c355e1c5dd50892b273c4369ba865108c8e880916abdeca9639c9917469ae721a32cd93738c320591e1b00af4fe7bfb04b889d6284ef07d69358234aa92499720618eed1ddc688b1d9a00af41dcc24da67561648891aec063849a8d35b60701178b58cd9a059d4cd3a4f3ef0a575d527903e9c2fa80b5f28679b9ac01f657cc6825b4c7ca10673e0577b2dafa56496ab9eb7c4527133fd5233c7ae2dbded1527ab9c2c10799a70f772f69e50ad2577f0fb4df1ea51e614ef6a031940213bdeaf064e9da268eae826c8f33a3cba007da1e6e32c7e3f4ee82c849c46b2d18ea4d1d7976a3ee14f8edf0681ce38fc8479d58d415dbfac3a9e04938ddf4cb937ebd0add69e30b2825240bb2337c1550dbdff9767897d90a1ec8131992f8af99cae7e29468d0bc87db13fd1cd5b2b9904c4141391098ba1e6fb26d7bf0df21db735a9a9e4b80a0175553040e550dccd6705c8ceea61e9ac342eda2d8ce1e5494c449be6b9bb62b54656692724841ca0d7e139bea743141f17a32385282127fa7cff98501f1091ddc91921ce79e5c1528c46d20c4a3e8ce6b229650750972dd90ac7d42008711cec18aa2d82c4cda26ec7e67a5dacbdecee916df8011a99e8fd2b1a678c53b86a83a705209bbf5f637085927c0bf0caa1c65e0c9b4466f77f313de88b4b6ab6c515c101ced12b85eefb3ae9ae47e74b288ccbf1214ec93baa99ab5f0578c7af	proofofcloud2	f
\.


--
-- TOC entry 2263 (class 0 OID 16463)
-- Dependencies: 204
-- Data for Name: cost_analyses; Type: TABLE DATA; Schema: public; Owner: cloud_cost_user
--

COPY public.cost_analyses (id, user_id, analysis_name, configuration, results, total_cost, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 2261 (class 0 OID 16445)
-- Dependencies: 202
-- Data for Name: inventory_scans; Type: TABLE DATA; Schema: public; Owner: cloud_cost_user
--

COPY public.inventory_scans (id, user_id, scan_name, provider, resources, total_cost, created_at, updated_at, scan_data, summary, scan_duration) FROM stdin;
3	3	\N	\N	\N	\N	2025-09-13 05:42:22.664143	2025-09-13 05:42:22.664143	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T05:42:22.663Z", "resources": [], "scanDuration": 4984}}	{"scanTime": "2025-09-13T05:42:22.663Z", "totalResources": 0, "scannedProviders": 4}	4985
4	3	\N	\N	\N	\N	2025-09-13 05:42:53.810029	2025-09-13 05:42:53.810029	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T05:42:53.809Z", "resources": [], "scanDuration": 4955}}	{"scanTime": "2025-09-13T05:42:53.809Z", "totalResources": 0, "scannedProviders": 4}	4960
5	3	\N	\N	\N	\N	2025-09-13 05:42:59.956897	2025-09-13 05:42:59.956897	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T05:42:59.956Z", "resources": [], "scanDuration": 5}}	{"scanTime": "2025-09-13T05:42:59.956Z", "totalResources": 0, "scannedProviders": 4}	10
6	3	\N	\N	\N	\N	2025-09-13 05:43:17.434576	2025-09-13 05:43:17.434576	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T05:43:17.434Z", "resources": [], "scanDuration": 4}}	{"scanTime": "2025-09-13T05:43:17.434Z", "totalResources": 0, "scannedProviders": 4}	6
7	3	\N	\N	\N	\N	2025-09-13 05:48:33.647192	2025-09-13 05:48:33.647192	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T05:48:33.646Z", "resources": [], "scanDuration": 4}}	{"scanTime": "2025-09-13T05:48:33.646Z", "totalResources": 0, "scannedProviders": 4}	5
8	3	\N	\N	\N	\N	2025-09-13 05:48:43.487697	2025-09-13 05:48:43.487697	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T05:48:43.487Z", "resources": [], "scanDuration": 4802}}	{"scanTime": "2025-09-13T05:48:43.487Z", "totalResources": 0, "scannedProviders": 4}	4803
9	3	\N	\N	\N	\N	2025-09-13 05:52:58.640273	2025-09-13 05:52:58.640273	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T05:52:58.638Z", "resources": [], "scanDuration": 5096}}	{"scanTime": "2025-09-13T05:52:58.638Z", "totalResources": 0, "scannedProviders": 4}	5099
10	3	\N	\N	\N	\N	2025-09-13 05:53:50.224932	2025-09-13 05:53:50.224932	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T05:53:50.224Z", "resources": [], "scanDuration": 8}}	{"scanTime": "2025-09-13T05:53:50.224Z", "totalResources": 0, "scannedProviders": 4}	9
11	3	\N	\N	\N	\N	2025-09-13 05:57:03.052711	2025-09-13 05:57:03.052711	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T05:57:03.051Z", "resources": [], "scanDuration": 5079}}	{"scanTime": "2025-09-13T05:57:03.051Z", "totalResources": 0, "scannedProviders": 4}	5082
12	3	\N	\N	\N	\N	2025-09-13 05:57:16.625145	2025-09-13 05:57:16.625145	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T05:57:16.624Z", "resources": [], "scanDuration": 7}}	{"scanTime": "2025-09-13T05:57:16.624Z", "totalResources": 0, "scannedProviders": 4}	9
13	3	\N	\N	\N	\N	2025-09-13 06:03:30.221443	2025-09-13 06:03:30.221443	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T06:03:30.219Z", "resources": [], "scanDuration": 5104}}	{"scanTime": "2025-09-13T06:03:30.219Z", "totalResources": 0, "scannedProviders": 4}	5106
14	3	\N	\N	\N	\N	2025-09-13 06:05:57.158551	2025-09-13 06:05:57.158551	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T06:05:57.156Z", "resources": [], "scanDuration": 5020}}	{"scanTime": "2025-09-13T06:05:57.156Z", "totalResources": 0, "scannedProviders": 4}	5022
15	3	\N	\N	\N	\N	2025-09-13 06:11:20.961919	2025-09-13 06:11:20.961919	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T06:11:20.960Z", "resources": [], "scanDuration": 5007}}	{"scanTime": "2025-09-13T06:11:20.960Z", "totalResources": 0, "scannedProviders": 4}	5010
16	3	\N	\N	\N	\N	2025-09-13 06:11:30.786025	2025-09-13 06:11:30.786025	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T06:11:30.785Z", "resources": [], "scanDuration": 8}}	{"scanTime": "2025-09-13T06:11:30.785Z", "totalResources": 0, "scannedProviders": 4}	9
17	3	\N	\N	\N	\N	2025-09-13 06:12:01.537065	2025-09-13 06:12:01.537065	{"success": true, "inventory": {"summary": {"services": {}, "locations": {}, "providers": {}, "totalResources": 0}, "scanDate": "2025-09-13T06:12:01.536Z", "resources": [], "scanDuration": 4834}}	{"scanTime": "2025-09-13T06:12:01.536Z", "totalResources": 0, "scannedProviders": 4}	4837
18	3	\N	\N	\N	\N	2025-09-13 06:16:10.652318	2025-09-13 06:16:10.652318	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1}, "locations": {"us-east-1": 2}, "providers": {"aws": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:16:10.650Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:16:10.650Z", "totalResources": 0, "scannedProviders": 4}	0
19	3	\N	\N	\N	\N	2025-09-13 06:16:26.952494	2025-09-13 06:16:26.952494	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1}, "locations": {"us-east-1": 2}, "providers": {"aws": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:16:26.951Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:16:26.951Z", "totalResources": 0, "scannedProviders": 4}	0
20	3	\N	\N	\N	\N	2025-09-13 06:16:30.052112	2025-09-13 06:16:30.052112	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1}, "locations": {"us-east-1": 2}, "providers": {"aws": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:16:30.050Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:16:30.050Z", "totalResources": 0, "scannedProviders": 4}	0
21	3	\N	\N	\N	\N	2025-09-13 06:17:32.371231	2025-09-13 06:17:32.371231	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1}, "locations": {"us-east-1": 2}, "providers": {"aws": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:17:32.370Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:17:32.370Z", "totalResources": 0, "scannedProviders": 4}	0
22	3	\N	\N	\N	\N	2025-09-13 06:17:35.293211	2025-09-13 06:17:35.293211	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1}, "locations": {"us-east-1": 2}, "providers": {"aws": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:17:35.291Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:17:35.291Z", "totalResources": 0, "scannedProviders": 4}	0
23	3	\N	\N	\N	\N	2025-09-13 06:17:54.101466	2025-09-13 06:17:54.101466	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1}, "locations": {"us-east-1": 2}, "providers": {"aws": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:17:54.100Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:17:54.101Z", "totalResources": 0, "scannedProviders": 4}	0
24	3	\N	\N	\N	\N	2025-09-13 06:21:28.074813	2025-09-13 06:21:28.074813	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1}, "locations": {"us-east-1": 2}, "providers": {"aws": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:21:28.072Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:21:28.072Z", "totalResources": 0, "scannedProviders": 4}	0
25	3	\N	\N	\N	\N	2025-09-13 06:21:38.573344	2025-09-13 06:21:38.573344	{"success": true, "inventory": {"summary": {"services": {"Compute": 1, "Object Storage": 1}, "locations": {"us-phoenix-1": 2}, "providers": {"oci": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:21:38.572Z", "resources": [{"id": "ocid1.instance.oc1.phx.abcdefghijklmnop", "name": "Sample OCI Compute Instance", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1}}, {"id": "ocid1.bucket.oc1.phx.abcdefghijklmnop", "name": "sample-oci-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:21:38.572Z", "totalResources": 0, "scannedProviders": 4}	0
39	3	\N	\N	\N	\N	2025-09-13 10:18:17.359334	2025-09-13 10:18:17.359334	{"success": true, "inventory": {"summary": {"services": {"Compute": 2, "Database": 1, "Load Balancer": 1, "Object Storage": 1}, "locations": {"us-ashburn-1": 1, "us-phoenix-1": 4}, "providers": {"oci": 5}, "totalResources": 5}, "scanDate": "2025-09-13T10:18:17.358Z", "resources": [{"id": "ocid1.instance.oc1.phx.bktw9ar5d5q", "name": "web-server-01", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.instance.oc1.ash.u5efchuxy0d", "name": "db-server-01", "type": "VM.Standard.E2.2", "state": "RUNNING", "service": "Compute", "location": "us-ashburn-1", "provider": "oci", "costDetails": {"ocpus": 2, "shape": "VM.Standard.E2.2", "memoryInGBs": 8, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.bucket.oc1.phx.epci5ai279l", "name": "app-data-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"sizeGB": 150, "storageClass": "Standard"}}, {"id": "ocid1.dbsystem.oc1.phx.8wsfepo68vt", "name": "prod-database", "type": "VM.Standard.E2.1", "state": "AVAILABLE", "service": "Database", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1", "memoryInGBs": 8, "databaseEdition": "Standard Edition"}}, {"id": "ocid1.loadbalancer.oc1.phx.7jpq901u8tq", "name": "web-lb-01", "type": "Flexible", "state": "ACTIVE", "service": "Load Balancer", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"shapeName": "flexible", "bandwidthMbps": 10}}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T10:18:17.358Z", "totalResources": 0, "scannedProviders": 4}	1
26	3	\N	\N	\N	\N	2025-09-13 06:21:45.365233	2025-09-13 06:21:45.365233	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1, "Compute": 1, "Object Storage": 1}, "locations": {"us-east-1": 2, "us-phoenix-1": 2}, "providers": {"aws": 2, "oci": 2}, "totalResources": 4}, "scanDate": "2025-09-13T06:21:45.364Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}, {"id": "ocid1.instance.oc1.phx.abcdefghijklmnop", "name": "Sample OCI Compute Instance", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1}}, {"id": "ocid1.bucket.oc1.phx.abcdefghijklmnop", "name": "sample-oci-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:21:45.364Z", "totalResources": 0, "scannedProviders": 4}	0
27	3	\N	\N	\N	\N	2025-09-13 06:21:58.708144	2025-09-13 06:21:58.708144	{"success": true, "inventory": {"summary": {"services": {"Compute": 1, "Object Storage": 1}, "locations": {"us-phoenix-1": 2}, "providers": {"oci": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:21:58.707Z", "resources": [{"id": "ocid1.instance.oc1.phx.abcdefghijklmnop", "name": "Sample OCI Compute Instance", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1}}, {"id": "ocid1.bucket.oc1.phx.abcdefghijklmnop", "name": "sample-oci-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:21:58.707Z", "totalResources": 0, "scannedProviders": 4}	0
28	3	\N	\N	\N	\N	2025-09-13 06:22:03.025363	2025-09-13 06:22:03.025363	{"success": true, "inventory": {"summary": {"services": {"Compute": 1, "Object Storage": 1}, "locations": {"us-phoenix-1": 2}, "providers": {"oci": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:22:03.023Z", "resources": [{"id": "ocid1.instance.oc1.phx.abcdefghijklmnop", "name": "Sample OCI Compute Instance", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1}}, {"id": "ocid1.bucket.oc1.phx.abcdefghijklmnop", "name": "sample-oci-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:22:03.023Z", "totalResources": 0, "scannedProviders": 4}	0
29	3	\N	\N	\N	\N	2025-09-13 06:23:44.38626	2025-09-13 06:23:44.38626	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1, "Compute": 1, "Object Storage": 1}, "locations": {"us-east-1": 2, "us-phoenix-1": 2}, "providers": {"aws": 2, "oci": 2}, "totalResources": 4}, "scanDate": "2025-09-13T06:23:44.385Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}, {"id": "ocid1.instance.oc1.phx.abcdefghijklmnop", "name": "Sample OCI Compute Instance", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1}}, {"id": "ocid1.bucket.oc1.phx.abcdefghijklmnop", "name": "sample-oci-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:23:44.385Z", "totalResources": 0, "scannedProviders": 4}	0
30	3	\N	\N	\N	\N	2025-09-13 06:30:21.886878	2025-09-13 06:30:21.886878	{"success": true, "inventory": {"summary": {"services": {"Compute": 1, "Object Storage": 1}, "locations": {"us-phoenix-1": 2}, "providers": {"oci": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:30:21.885Z", "resources": [{"id": "ocid1.instance.oc1.phx.abcdefghijklmnop", "name": "Sample OCI Compute Instance", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1}}, {"id": "ocid1.bucket.oc1.phx.abcdefghijklmnop", "name": "sample-oci-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:30:21.885Z", "totalResources": 0, "scannedProviders": 4}	1
31	3	\N	\N	\N	\N	2025-09-13 06:30:28.690888	2025-09-13 06:30:28.690888	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1}, "locations": {"us-east-1": 2}, "providers": {"aws": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:30:28.690Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:30:28.690Z", "totalResources": 0, "scannedProviders": 4}	1
32	3	\N	\N	\N	\N	2025-09-13 06:30:40.378836	2025-09-13 06:30:40.378836	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1, "Compute": 1, "Object Storage": 1}, "locations": {"us-east-1": 2, "us-phoenix-1": 2}, "providers": {"aws": 2, "oci": 2}, "totalResources": 4}, "scanDate": "2025-09-13T06:30:40.378Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}, {"id": "ocid1.instance.oc1.phx.abcdefghijklmnop", "name": "Sample OCI Compute Instance", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1}}, {"id": "ocid1.bucket.oc1.phx.abcdefghijklmnop", "name": "sample-oci-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:30:40.378Z", "totalResources": 0, "scannedProviders": 4}	1
33	3	\N	\N	\N	\N	2025-09-13 06:31:14.258089	2025-09-13 06:31:14.258089	{"success": true, "inventory": {"summary": {"services": {"Compute": 1, "Object Storage": 1}, "locations": {"us-phoenix-1": 2}, "providers": {"oci": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:31:14.257Z", "resources": [{"id": "ocid1.instance.oc1.phx.abcdefghijklmnop", "name": "Sample OCI Compute Instance", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1}}, {"id": "ocid1.bucket.oc1.phx.abcdefghijklmnop", "name": "sample-oci-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:31:14.257Z", "totalResources": 0, "scannedProviders": 4}	0
34	3	\N	\N	\N	\N	2025-09-13 06:31:22.894743	2025-09-13 06:31:22.894743	{"success": true, "inventory": {"summary": {"services": {"Compute": 1, "Object Storage": 1}, "locations": {"us-phoenix-1": 2}, "providers": {"oci": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:31:22.894Z", "resources": [{"id": "ocid1.instance.oc1.phx.abcdefghijklmnop", "name": "Sample OCI Compute Instance", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1}}, {"id": "ocid1.bucket.oc1.phx.abcdefghijklmnop", "name": "sample-oci-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:31:22.894Z", "totalResources": 0, "scannedProviders": 4}	1
35	3	\N	\N	\N	\N	2025-09-13 06:32:32.29169	2025-09-13 06:32:32.29169	{"success": true, "inventory": {"summary": {"services": {"Compute": 1, "Object Storage": 1}, "locations": {"us-phoenix-1": 2}, "providers": {"oci": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:32:32.291Z", "resources": [{"id": "ocid1.instance.oc1.phx.abcdefghijklmnop", "name": "Sample OCI Compute Instance", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1}}, {"id": "ocid1.bucket.oc1.phx.abcdefghijklmnop", "name": "sample-oci-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:32:32.291Z", "totalResources": 0, "scannedProviders": 4}	1
36	3	\N	\N	\N	\N	2025-09-13 06:32:41.610997	2025-09-13 06:32:41.610997	{"success": true, "inventory": {"summary": {"services": {"Compute": 1, "Object Storage": 1}, "locations": {"us-phoenix-1": 2}, "providers": {"oci": 2}, "totalResources": 2}, "scanDate": "2025-09-13T06:32:41.610Z", "resources": [{"id": "ocid1.instance.oc1.phx.abcdefghijklmnop", "name": "Sample OCI Compute Instance", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1}}, {"id": "ocid1.bucket.oc1.phx.abcdefghijklmnop", "name": "sample-oci-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:32:41.610Z", "totalResources": 0, "scannedProviders": 4}	1
37	3	\N	\N	\N	\N	2025-09-13 06:38:02.214567	2025-09-13 06:38:02.214567	{"success": true, "inventory": {"summary": {"services": {"Compute": 2, "Database": 1, "Load Balancer": 1, "Object Storage": 1}, "locations": {"us-ashburn-1": 1, "us-phoenix-1": 4}, "providers": {"oci": 5}, "totalResources": 5}, "scanDate": "2025-09-13T06:38:02.212Z", "resources": [{"id": "ocid1.instance.oc1.phx.27fnllrkly9", "name": "web-server-01", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.instance.oc1.ash.1nfdrrz6c0t", "name": "db-server-01", "type": "VM.Standard.E2.2", "state": "RUNNING", "service": "Compute", "location": "us-ashburn-1", "provider": "oci", "costDetails": {"ocpus": 2, "shape": "VM.Standard.E2.2", "memoryInGBs": 8, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.bucket.oc1.phx.g0143c8xg8t", "name": "app-data-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"sizeGB": 150, "storageClass": "Standard"}}, {"id": "ocid1.dbsystem.oc1.phx.m4w984zyb8", "name": "prod-database", "type": "VM.Standard.E2.1", "state": "AVAILABLE", "service": "Database", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1", "memoryInGBs": 8, "databaseEdition": "Standard Edition"}}, {"id": "ocid1.loadbalancer.oc1.phx.q8tnjjj7p2", "name": "web-lb-01", "type": "Flexible", "state": "ACTIVE", "service": "Load Balancer", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"shapeName": "flexible", "bandwidthMbps": 10}}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:38:02.212Z", "totalResources": 0, "scannedProviders": 4}	0
38	3	\N	\N	\N	\N	2025-09-13 06:38:32.101042	2025-09-13 06:38:32.101042	{"success": true, "inventory": {"summary": {"services": {"Compute": 2, "Database": 1, "Load Balancer": 1, "Object Storage": 1}, "locations": {"us-ashburn-1": 1, "us-phoenix-1": 4}, "providers": {"oci": 5}, "totalResources": 5}, "scanDate": "2025-09-13T06:38:32.100Z", "resources": [{"id": "ocid1.instance.oc1.phx.3tuly3nlwzf", "name": "web-server-01", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.instance.oc1.ash.6iq9f8bowrh", "name": "db-server-01", "type": "VM.Standard.E2.2", "state": "RUNNING", "service": "Compute", "location": "us-ashburn-1", "provider": "oci", "costDetails": {"ocpus": 2, "shape": "VM.Standard.E2.2", "memoryInGBs": 8, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.bucket.oc1.phx.jwa2clo0wue", "name": "app-data-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"sizeGB": 150, "storageClass": "Standard"}}, {"id": "ocid1.dbsystem.oc1.phx.0mb6jjdw5kj", "name": "prod-database", "type": "VM.Standard.E2.1", "state": "AVAILABLE", "service": "Database", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1", "memoryInGBs": 8, "databaseEdition": "Standard Edition"}}, {"id": "ocid1.loadbalancer.oc1.phx.9t8uwr53i57", "name": "web-lb-01", "type": "Flexible", "state": "ACTIVE", "service": "Load Balancer", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"shapeName": "flexible", "bandwidthMbps": 10}}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T06:38:32.100Z", "totalResources": 0, "scannedProviders": 4}	0
40	3	\N	\N	\N	\N	2025-09-13 10:18:21.981406	2025-09-13 10:18:21.981406	{"success": true, "inventory": {"summary": {"services": {"Compute": 2, "Database": 1, "Load Balancer": 1, "Object Storage": 1}, "locations": {"us-ashburn-1": 1, "us-phoenix-1": 4}, "providers": {"oci": 5}, "totalResources": 5}, "scanDate": "2025-09-13T10:18:21.980Z", "resources": [{"id": "ocid1.instance.oc1.phx.g39tfly1rl", "name": "web-server-01", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.instance.oc1.ash.xxocp9jroo8", "name": "db-server-01", "type": "VM.Standard.E2.2", "state": "RUNNING", "service": "Compute", "location": "us-ashburn-1", "provider": "oci", "costDetails": {"ocpus": 2, "shape": "VM.Standard.E2.2", "memoryInGBs": 8, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.bucket.oc1.phx.w6wlaak5pr", "name": "app-data-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"sizeGB": 150, "storageClass": "Standard"}}, {"id": "ocid1.dbsystem.oc1.phx.segtca9c8a", "name": "prod-database", "type": "VM.Standard.E2.1", "state": "AVAILABLE", "service": "Database", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1", "memoryInGBs": 8, "databaseEdition": "Standard Edition"}}, {"id": "ocid1.loadbalancer.oc1.phx.exwuqk968v", "name": "web-lb-01", "type": "Flexible", "state": "ACTIVE", "service": "Load Balancer", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"shapeName": "flexible", "bandwidthMbps": 10}}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T10:18:21.980Z", "totalResources": 0, "scannedProviders": 4}	0
41	3	\N	\N	\N	\N	2025-09-13 10:18:39.129793	2025-09-13 10:18:39.129793	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1}, "locations": {"us-east-1": 2}, "providers": {"aws": 2}, "totalResources": 2}, "scanDate": "2025-09-13T10:18:39.129Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T10:18:39.129Z", "totalResources": 0, "scannedProviders": 4}	1
42	3	\N	\N	\N	\N	2025-09-13 10:18:43.323578	2025-09-13 10:18:43.323578	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1}, "locations": {"us-east-1": 2}, "providers": {"aws": 2}, "totalResources": 2}, "scanDate": "2025-09-13T10:18:43.322Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T10:18:43.322Z", "totalResources": 0, "scannedProviders": 4}	0
43	3	\N	\N	\N	\N	2025-09-13 10:19:10.340386	2025-09-13 10:19:10.340386	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1}, "locations": {"us-east-1": 2}, "providers": {"aws": 2}, "totalResources": 2}, "scanDate": "2025-09-13T10:19:10.339Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T10:19:10.339Z", "totalResources": 0, "scannedProviders": 4}	0
44	3	\N	\N	\N	\N	2025-09-13 10:19:16.680535	2025-09-13 10:19:16.680535	{"success": true, "inventory": {"summary": {"services": {"S3": 1, "EC2": 1}, "locations": {"us-east-1": 2}, "providers": {"aws": 2}, "totalResources": 2}, "scanDate": "2025-09-13T10:19:16.679Z", "resources": [{"id": "i-1234567890abcdef0", "name": "Sample EC2 Instance", "type": "t3.micro", "state": "running", "service": "EC2", "location": "us-east-1", "provider": "aws", "costDetails": {"vcpus": 2, "memory": 1, "instanceType": "t3.micro"}}, {"id": "sample-bucket-123", "name": "sample-bucket-123", "type": "Bucket", "state": "active", "service": "S3", "location": "us-east-1", "provider": "aws"}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T10:19:16.680Z", "totalResources": 0, "scannedProviders": 4}	1
45	3	\N	\N	\N	\N	2025-09-13 11:02:30.78098	2025-09-13 11:02:30.78098	{"source": "terraform", "summary": {"regions": {"us-east-1": 36, "ap-south-1": 1, "ap-south-1a": 3, "ap-south-1b": 3, "ap-south-1c": 3}, "services": {"Other": 14, "Compute": 2, "Storage": 2, "Database": 5, "Networking": 23}, "providers": {"aws": 46}, "totalResources": 46}, "scanTime": "2025-09-13T11:02:30.779Z", "resources": [{"id": "vpc-0a1b2c3d4e5f67890", "name": "big-3tier-prod-vpc", "tags": {"Env": "prod", "Name": "big-3tier-prod-vpc", "Project": "big-3tier"}, "type": "VPC", "state": "active", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_vpc", "terraformAddress": "main", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"cidrBlock": "10.20.0.0/16", "estimatedMonthlyCost": 0}}, {"id": "subnet-0pub111", "name": "big-3tier-prod-public-ap-south-1a", "tags": {"Name": "big-3tier-prod-public-ap-south-1a"}, "type": "Subnet", "state": "active", "service": "Networking", "location": "ap-south-1a", "metadata": {"terraformMode": "managed", "terraformType": "aws_subnet", "terraformAddress": "public", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"cidrBlock": "10.20.0.0/20", "availabilityZone": "ap-south-1a", "estimatedMonthlyCost": 0}}, {"id": "subnet-0pub222", "name": "big-3tier-prod-public-ap-south-1b", "tags": {"Name": "big-3tier-prod-public-ap-south-1b"}, "type": "Subnet", "state": "active", "service": "Networking", "location": "ap-south-1b", "metadata": {"terraformMode": "managed", "terraformType": "aws_subnet", "terraformAddress": "public", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"cidrBlock": "10.20.16.0/20", "availabilityZone": "ap-south-1b", "estimatedMonthlyCost": 0}}, {"id": "subnet-0pub333", "name": "big-3tier-prod-public-ap-south-1c", "tags": {"Name": "big-3tier-prod-public-ap-south-1c"}, "type": "Subnet", "state": "active", "service": "Networking", "location": "ap-south-1c", "metadata": {"terraformMode": "managed", "terraformType": "aws_subnet", "terraformAddress": "public", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"cidrBlock": "10.20.32.0/20", "availabilityZone": "ap-south-1c", "estimatedMonthlyCost": 0}}, {"id": "subnet-0app111", "name": "big-3tier-prod-private-app-ap-south-1a", "tags": {"Name": "big-3tier-prod-private-app-ap-south-1a"}, "type": "Subnet", "state": "active", "service": "Networking", "location": "ap-south-1a", "metadata": {"terraformMode": "managed", "terraformType": "aws_subnet", "terraformAddress": "private_app", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"cidrBlock": "10.20.128.0/20", "availabilityZone": "ap-south-1a", "estimatedMonthlyCost": 0}}, {"id": "subnet-0app222", "name": "big-3tier-prod-private-app-ap-south-1b", "tags": {"Name": "big-3tier-prod-private-app-ap-south-1b"}, "type": "Subnet", "state": "active", "service": "Networking", "location": "ap-south-1b", "metadata": {"terraformMode": "managed", "terraformType": "aws_subnet", "terraformAddress": "private_app", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"cidrBlock": "10.20.144.0/20", "availabilityZone": "ap-south-1b", "estimatedMonthlyCost": 0}}, {"id": "subnet-0app333", "name": "big-3tier-prod-private-app-ap-south-1c", "tags": {"Name": "big-3tier-prod-private-app-ap-south-1c"}, "type": "Subnet", "state": "active", "service": "Networking", "location": "ap-south-1c", "metadata": {"terraformMode": "managed", "terraformType": "aws_subnet", "terraformAddress": "private_app", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"cidrBlock": "10.20.160.0/20", "availabilityZone": "ap-south-1c", "estimatedMonthlyCost": 0}}, {"id": "subnet-0db111", "name": "big-3tier-prod-private-db-ap-south-1a", "tags": {"Name": "big-3tier-prod-private-db-ap-south-1a"}, "type": "Subnet", "state": "active", "service": "Networking", "location": "ap-south-1a", "metadata": {"terraformMode": "managed", "terraformType": "aws_subnet", "terraformAddress": "private_db", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"cidrBlock": "10.20.192.0/20", "availabilityZone": "ap-south-1a", "estimatedMonthlyCost": 0}}, {"id": "subnet-0db222", "name": "big-3tier-prod-private-db-ap-south-1b", "tags": {"Name": "big-3tier-prod-private-db-ap-south-1b"}, "type": "Subnet", "state": "active", "service": "Networking", "location": "ap-south-1b", "metadata": {"terraformMode": "managed", "terraformType": "aws_subnet", "terraformAddress": "private_db", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"cidrBlock": "10.20.208.0/20", "availabilityZone": "ap-south-1b", "estimatedMonthlyCost": 0}}, {"id": "subnet-0db333", "name": "big-3tier-prod-private-db-ap-south-1c", "tags": {"Name": "big-3tier-prod-private-db-ap-south-1c"}, "type": "Subnet", "state": "active", "service": "Networking", "location": "ap-south-1c", "metadata": {"terraformMode": "managed", "terraformType": "aws_subnet", "terraformAddress": "private_db", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"cidrBlock": "10.20.224.0/20", "availabilityZone": "ap-south-1c", "estimatedMonthlyCost": 0}}, {"id": "igw-0aaabbbccc", "name": "big-3tier-prod-igw", "tags": {"Name": "big-3tier-prod-igw"}, "type": "InternetGateway", "state": "active", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_internet_gateway", "terraformAddress": "igw", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "eipalloc-0nat111", "name": "nat", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_eip", "terraformAddress": "nat", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "eipalloc-0nat222", "name": "nat", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_eip", "terraformAddress": "nat", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "eipalloc-0nat333", "name": "nat", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_eip", "terraformAddress": "nat", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "nat-0a111", "name": "nat", "tags": {}, "type": "NATGateway", "state": "active", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_nat_gateway", "terraformAddress": "nat", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "nat-0a222", "name": "nat", "tags": {}, "type": "NATGateway", "state": "active", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_nat_gateway", "terraformAddress": "nat", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "nat-0a333", "name": "nat", "tags": {}, "type": "NATGateway", "state": "active", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_nat_gateway", "terraformAddress": "nat", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "rtb-0pub", "name": "big-3tier-prod-rt-public", "tags": {"Name": "big-3tier-prod-rt-public"}, "type": "RouteTable", "state": "active", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_route_table", "terraformAddress": "public", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "rtb-0app", "name": "big-3tier-prod-rt-private-app", "tags": {"Name": "big-3tier-prod-rt-private-app"}, "type": "RouteTable", "state": "active", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_route_table", "terraformAddress": "private_app", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "rtb-0db", "name": "big-3tier-prod-rt-private-db", "tags": {"Name": "big-3tier-prod-rt-private-db"}, "type": "RouteTable", "state": "active", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_route_table", "terraformAddress": "private_db", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "sg-0alb", "name": "big-3tier-prod-alb-sg", "tags": {}, "type": "SecurityGroup", "state": "active", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_security_group", "terraformAddress": "alb", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "sg-0app", "name": "big-3tier-prod-app-sg", "tags": {}, "type": "SecurityGroup", "state": "active", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_security_group", "terraformAddress": "app", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "sg-0db", "name": "big-3tier-prod-db-sg", "tags": {}, "type": "SecurityGroup", "state": "active", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_security_group", "terraformAddress": "db", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "arn:aws:elasticloadbalancing:ap-south-1:123456789012:loadbalancer/app/big-3tier/50dc6c495c0c9188", "name": "web", "tags": {}, "type": "LoadBalancer", "state": "active", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_lb", "terraformAddress": "web", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 22.5}}, {"id": "arn:aws:elasticloadbalancing:ap-south-1:123456789012:targetgroup/big-3tier/abc123", "name": "app_tg", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_lb_target_group", "terraformAddress": "app_tg", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 22.5}}, {"id": "arn:aws:elasticloadbalancing:ap-south-1:123456789012:listener/app/big-3tier/50dc6c495c0c9188/aaa111", "name": "https", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_lb_listener", "terraformAddress": "https", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"sslCertificate": "arn:aws:acm:ap-south-1:123456789012:certificate/your-acm-cert-id", "estimatedMonthlyCost": 22.5}}, {"id": "lt-0a1b2c3d4e", "name": "big-3tier-prod-app-2025-09-04", "tags": {}, "type": "LaunchTemplate", "state": "active", "service": "Compute", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_launch_template", "terraformAddress": "app", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "aws_autoscaling_group.app", "name": "big-3tier-prod-asg", "tags": {}, "type": "AutoScalingGroup", "state": "active", "service": "Compute", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_autoscaling_group", "terraformAddress": "app", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "b3a1f8a9-tt", "name": "big-3tier-prod-scaleout", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_autoscaling_policy", "terraformAddress": "cpu_scale_out", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "aws_db_subnet_group.dbsub", "name": "big-3tier-prod-dbsub", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_db_subnet_group", "terraformAddress": "dbsub", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "big-3tier-prod-aurora", "name": "appdb", "tags": {}, "type": "DatabaseCluster", "state": "active", "service": "Database", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_rds_cluster", "terraformAddress": "aurora", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"engine": "aurora-mysql", "estimatedMonthlyCost": 50}}, {"id": "big-3tier-prod-aurora-0", "name": "aurora_instances", "tags": {}, "type": "DatabaseInstance", "state": "active", "service": "Database", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_rds_cluster_instance", "terraformAddress": "aurora_instances", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"vcpus": 2, "engine": "aurora-mysql", "memory": 4, "instanceClass": "db.r7g.2xlarge", "estimatedMonthlyCost": 136.4}}, {"id": "big-3tier-prod-aurora-1", "name": "aurora_instances", "tags": {}, "type": "DatabaseInstance", "state": "active", "service": "Database", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_rds_cluster_instance", "terraformAddress": "aurora_instances", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"vcpus": 2, "engine": "aurora-mysql", "memory": 4, "instanceClass": "db.r7g.2xlarge", "estimatedMonthlyCost": 136.4}}, {"id": "big-3tier-prod-aurora-2", "name": "aurora_instances", "tags": {}, "type": "DatabaseInstance", "state": "active", "service": "Database", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_rds_cluster_instance", "terraformAddress": "aurora_instances", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"vcpus": 2, "engine": "aurora-mysql", "memory": 4, "instanceClass": "db.r7g.2xlarge", "estimatedMonthlyCost": 136.4}}, {"id": "aws_elasticache_subnet_group.redis", "name": "big-3tier-prod-redis-subnet", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_elasticache_subnet_group", "terraformAddress": "redis", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "big-3tier-prod-redis", "name": "redis", "tags": {}, "type": "CacheReplicationGroup", "state": "active", "service": "Database", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_elasticache_replication_group", "terraformAddress": "redis", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "fs-0abc123", "name": "big-3tier-prod-efs", "tags": {"Name": "big-3tier-prod-efs"}, "type": "FileSystem", "state": "active", "service": "Storage", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_efs_file_system", "terraformAddress": "shared", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "fsmt-111", "name": "mt", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_efs_mount_target", "terraformAddress": "mt", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "fsmt-222", "name": "mt", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_efs_mount_target", "terraformAddress": "mt", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "fsmt-333", "name": "mt", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_efs_mount_target", "terraformAddress": "mt", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "big-3tier-prod-assets-1234", "name": "big-3tier-prod-assets-1234", "tags": {}, "type": "Bucket", "state": "active", "service": "Storage", "location": "ap-south-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_s3_bucket", "terraformAddress": "assets", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "a1b2c3d4-oac", "name": "big-3tier-prod-oac", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_cloudfront_origin_access_control", "terraformAddress": "oac", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 85}}, {"id": "EDFDVBD632BHDS5", "name": "cdn", "tags": {}, "type": "CDN", "state": "Deployed", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_cloudfront_distribution", "terraformAddress": "cdn", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"origins": [{"origin_id": "s3assets", "domain_name": "big-3tier-prod-assets-1234.s3.ap-south-1.amazonaws.com", "origin_access_control_id": "a1b2c3d4-oac"}], "defaultRootObject": "index.html", "estimatedMonthlyCost": 85}}, {"id": "1111aaaa-bbbb-cccc-dddd-2222eeeeffff", "name": "big-3tier-prod-waf", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"awsArn": "arn:aws:wafv2:us-east-1:123456789012:global/webacl/big-3tier-prod-waf/1111aaaa-bbbb-cccc-dddd-2222eeeeffff", "terraformMode": "managed", "terraformType": "aws_wafv2_web_acl", "terraformAddress": "main", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "aws_route53_record.app", "name": "app.example.com", "tags": {}, "type": "DNSRecord", "state": "active", "service": "Networking", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_route53_record", "terraformAddress": "app", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}, {"id": "aws_budgets_budget.monthly_cap", "name": "prod-monthly-20000", "tags": {}, "type": "Unknown", "state": "active", "service": "Other", "location": "us-east-1", "metadata": {"terraformMode": "managed", "terraformType": "aws_budgets_budget", "terraformAddress": "monthly_cap", "terraformProvider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]"}, "provider": "aws", "costDetails": {"estimatedMonthlyCost": 0}}]}	{"regions": {"us-east-1": 36, "ap-south-1": 1, "ap-south-1a": 3, "ap-south-1b": 3, "ap-south-1c": 3}, "services": {"Other": 14, "Compute": 2, "Storage": 2, "Database": 5, "Networking": 23}, "providers": {"aws": 46}, "totalResources": 46}	0
46	3	\N	\N	\N	\N	2025-09-13 11:57:30.589753	2025-09-13 11:57:30.589753	{"success": true, "inventory": {"summary": {"services": {"Compute": 2, "Database": 1, "Load Balancer": 1, "Object Storage": 1}, "locations": {"us-ashburn-1": 1, "us-phoenix-1": 4}, "providers": {"oci": 5}, "totalResources": 5}, "scanDate": "2025-09-13T11:57:30.587Z", "resources": [{"id": "ocid1.instance.oc1.phx.p2bmto9n4m", "name": "web-server-01", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.instance.oc1.ash.mtj3janvlrd", "name": "db-server-01", "type": "VM.Standard.E2.2", "state": "RUNNING", "service": "Compute", "location": "us-ashburn-1", "provider": "oci", "costDetails": {"ocpus": 2, "shape": "VM.Standard.E2.2", "memoryInGBs": 8, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.bucket.oc1.phx.rqg1tmy3lxh", "name": "app-data-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"sizeGB": 150, "storageClass": "Standard"}}, {"id": "ocid1.dbsystem.oc1.phx.sxejs7czjx", "name": "prod-database", "type": "VM.Standard.E2.1", "state": "AVAILABLE", "service": "Database", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1", "memoryInGBs": 8, "databaseEdition": "Standard Edition"}}, {"id": "ocid1.loadbalancer.oc1.phx.r1whxryvnbd", "name": "web-lb-01", "type": "Flexible", "state": "ACTIVE", "service": "Load Balancer", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"shapeName": "flexible", "bandwidthMbps": 10}}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T11:57:30.587Z", "totalResources": 0, "scannedProviders": 4}	1
47	3	\N	\N	\N	\N	2025-09-13 12:58:55.329914	2025-09-13 12:58:55.329914	{"success": true, "inventory": {"summary": {"services": {"Compute": 2, "Database": 1, "Load Balancer": 1, "Object Storage": 1}, "locations": {"us-ashburn-1": 1, "us-phoenix-1": 4}, "providers": {"oci": 5}, "totalResources": 5}, "scanDate": "2025-09-13T12:58:55.329Z", "resources": [{"id": "ocid1.instance.oc1.phx.webs75eoro", "name": "web-server-01", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.instance.oc1.ash.341qazjuces", "name": "db-server-01", "type": "VM.Standard.E2.2", "state": "RUNNING", "service": "Compute", "location": "us-ashburn-1", "provider": "oci", "costDetails": {"ocpus": 2, "shape": "VM.Standard.E2.2", "memoryInGBs": 8, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.bucket.oc1.phx.xy5r2e98qlr", "name": "app-data-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"sizeGB": 150, "storageClass": "Standard"}}, {"id": "ocid1.dbsystem.oc1.phx.j6ewhfxyhj", "name": "prod-database", "type": "VM.Standard.E2.1", "state": "AVAILABLE", "service": "Database", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1", "memoryInGBs": 8, "databaseEdition": "Standard Edition"}}, {"id": "ocid1.loadbalancer.oc1.phx.ogb8cd0hpqs", "name": "web-lb-01", "type": "Flexible", "state": "ACTIVE", "service": "Load Balancer", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"shapeName": "flexible", "bandwidthMbps": 10}}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T12:58:55.329Z", "totalResources": 0, "scannedProviders": 4}	1
48	3	\N	\N	\N	\N	2025-09-13 12:59:16.471889	2025-09-13 12:59:16.471889	{"success": true, "inventory": {"summary": {"services": {"Compute": 2, "Database": 1, "Load Balancer": 1, "Object Storage": 1}, "locations": {"us-ashburn-1": 1, "us-phoenix-1": 4}, "providers": {"oci": 5}, "totalResources": 5}, "scanDate": "2025-09-13T12:59:16.471Z", "resources": [{"id": "ocid1.instance.oc1.phx.x2vupmbbvs", "name": "web-server-01", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.instance.oc1.ash.ldmb5d7wmkf", "name": "db-server-01", "type": "VM.Standard.E2.2", "state": "RUNNING", "service": "Compute", "location": "us-ashburn-1", "provider": "oci", "costDetails": {"ocpus": 2, "shape": "VM.Standard.E2.2", "memoryInGBs": 8, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.bucket.oc1.phx.h2o0hfop05h", "name": "app-data-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"sizeGB": 150, "storageClass": "Standard"}}, {"id": "ocid1.dbsystem.oc1.phx.4n4ifx33vb", "name": "prod-database", "type": "VM.Standard.E2.1", "state": "AVAILABLE", "service": "Database", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1", "memoryInGBs": 8, "databaseEdition": "Standard Edition"}}, {"id": "ocid1.loadbalancer.oc1.phx.rbof6vmd5o", "name": "web-lb-01", "type": "Flexible", "state": "ACTIVE", "service": "Load Balancer", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"shapeName": "flexible", "bandwidthMbps": 10}}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T12:59:16.471Z", "totalResources": 0, "scannedProviders": 4}	0
49	3	\N	\N	\N	\N	2025-09-13 13:28:39.837633	2025-09-13 13:28:39.837633	{"success": true, "inventory": {"summary": {"services": {"Compute": 2, "Database": 1, "Load Balancer": 1, "Object Storage": 1}, "locations": {"us-ashburn-1": 1, "us-phoenix-1": 4}, "providers": {"oci": 5}, "totalResources": 5}, "scanDate": "2025-09-13T13:28:39.837Z", "resources": [{"id": "ocid1.instance.oc1.phx.i38sha15mii", "name": "web-server-01", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.instance.oc1.ash.7yz9jlllyze", "name": "db-server-01", "type": "VM.Standard.E2.2", "state": "RUNNING", "service": "Compute", "location": "us-ashburn-1", "provider": "oci", "costDetails": {"ocpus": 2, "shape": "VM.Standard.E2.2", "memoryInGBs": 8, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.bucket.oc1.phx.oe1bv9bmcjk", "name": "app-data-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"sizeGB": 150, "storageClass": "Standard"}}, {"id": "ocid1.dbsystem.oc1.phx.ljhsklg0shh", "name": "prod-database", "type": "VM.Standard.E2.1", "state": "AVAILABLE", "service": "Database", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1", "memoryInGBs": 8, "databaseEdition": "Standard Edition"}}, {"id": "ocid1.loadbalancer.oc1.phx.b7gin6on6ui", "name": "web-lb-01", "type": "Flexible", "state": "ACTIVE", "service": "Load Balancer", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"shapeName": "flexible", "bandwidthMbps": 10}}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T13:28:39.837Z", "totalResources": 0, "scannedProviders": 4}	1
50	3	\N	\N	\N	\N	2025-09-13 13:29:48.817479	2025-09-13 13:29:48.817479	{"success": true, "inventory": {"summary": {"services": {"Compute": 2, "Database": 1, "Load Balancer": 1, "Object Storage": 1}, "locations": {"us-ashburn-1": 1, "us-phoenix-1": 4}, "providers": {"oci": 5}, "totalResources": 5}, "scanDate": "2025-09-13T13:29:48.816Z", "resources": [{"id": "ocid1.instance.oc1.phx.8brwkpuvn3i", "name": "web-server-01", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.instance.oc1.ash.flvpc5j6ool", "name": "db-server-01", "type": "VM.Standard.E2.2", "state": "RUNNING", "service": "Compute", "location": "us-ashburn-1", "provider": "oci", "costDetails": {"ocpus": 2, "shape": "VM.Standard.E2.2", "memoryInGBs": 8, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.bucket.oc1.phx.hgfd7zwbhgm", "name": "app-data-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"sizeGB": 150, "storageClass": "Standard"}}, {"id": "ocid1.dbsystem.oc1.phx.rh9st78xqxq", "name": "prod-database", "type": "VM.Standard.E2.1", "state": "AVAILABLE", "service": "Database", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1", "memoryInGBs": 8, "databaseEdition": "Standard Edition"}}, {"id": "ocid1.loadbalancer.oc1.phx.fujtr3hdxdt", "name": "web-lb-01", "type": "Flexible", "state": "ACTIVE", "service": "Load Balancer", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"shapeName": "flexible", "bandwidthMbps": 10}}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T13:29:48.816Z", "totalResources": 0, "scannedProviders": 4}	0
51	3	\N	\N	\N	\N	2025-09-13 13:30:47.089728	2025-09-13 13:30:47.089728	{"success": true, "inventory": {"summary": {"services": {"Compute": 2, "Database": 1, "Load Balancer": 1, "Object Storage": 1}, "locations": {"us-ashburn-1": 1, "us-phoenix-1": 4}, "providers": {"oci": 5}, "totalResources": 5}, "scanDate": "2025-09-13T13:30:47.089Z", "resources": [{"id": "ocid1.instance.oc1.phx.l5cj43799r9", "name": "web-server-01", "type": "VM.Standard.E2.1.Micro", "state": "RUNNING", "service": "Compute", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1.Micro", "memoryInGBs": 1, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.instance.oc1.ash.tagrduvax6o", "name": "db-server-01", "type": "VM.Standard.E2.2", "state": "RUNNING", "service": "Compute", "location": "us-ashburn-1", "provider": "oci", "costDetails": {"ocpus": 2, "shape": "VM.Standard.E2.2", "memoryInGBs": 8, "operatingSystem": "Oracle Linux 8"}}, {"id": "ocid1.bucket.oc1.phx.fqnnbx466u", "name": "app-data-bucket", "type": "Bucket", "state": "ACTIVE", "service": "Object Storage", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"sizeGB": 150, "storageClass": "Standard"}}, {"id": "ocid1.dbsystem.oc1.phx.3df4m4yduqw", "name": "prod-database", "type": "VM.Standard.E2.1", "state": "AVAILABLE", "service": "Database", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"ocpus": 1, "shape": "VM.Standard.E2.1", "memoryInGBs": 8, "databaseEdition": "Standard Edition"}}, {"id": "ocid1.loadbalancer.oc1.phx.zmxi77welec", "name": "web-lb-01", "type": "Flexible", "state": "ACTIVE", "service": "Load Balancer", "location": "us-phoenix-1", "provider": "oci", "costDetails": {"shapeName": "flexible", "bandwidthMbps": 10}}], "scanDuration": 1000}}	{"scanTime": "2025-09-13T13:30:47.089Z", "totalResources": 0, "scannedProviders": 4}	0
\.


--
-- TOC entry 2255 (class 0 OID 16392)
-- Dependencies: 196
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: cloud_cost_user
--

COPY public.sessions (sid, sess, expire) FROM stdin;
rtMkgWVaQ0gEzEANZC3aa3H_4c1kyjK_	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T05:05:56.808Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 05:05:57
f0B7bGHgZJSevH7zJhaTk3sriZiGeSA4	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T05:06:03.357Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 05:06:04
sM2JYoaSgDl2mfyCL62Wd3P2Jqk_B9tP	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T05:08:19.788Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 05:08:20
lmI-qaIQlA51T_dylQWctyJfcgrXCpay	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T05:12:45.181Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 05:12:46
XCjiO1L__qD1xABInC_lhMuKQUJqPwRq	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T15:05:02.732Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 15:05:03
j-C9KbwF2yb9r5kZP3_ROh7r09zQo1sa	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T15:24:50.380Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 15:24:51
tPZY72KolGTFVyybRmuTpI-nUmgStkES	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T05:33:43.742Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 05:33:44
iMlL8TBbASqNtDZ8pG4iWUTuNAXltRpe	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T05:19:49.658Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 05:19:50
k_I86PgU2Av7vLubf8g2Lx6NMEqAzZBJ	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T05:18:05.792Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": 3}}	2025-09-20 05:27:59
52e9UKMyeLGNF418_Hdyoq0soudk9-tO	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T05:16:31.829Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 05:16:32
XlDOxPpYZBVjTEeRgk9rfqaoD6od-P1p	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T05:17:59.676Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 05:18:00
glZaPiSCIKwMK91TzQumSq4RRsc3GPVe	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T05:33:43.921Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 05:33:44
dokmRSt44Ze6Yi_vovh__HbHCsk-cjGk	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T05:37:02.823Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 05:37:03
vPEP36XkcRS1zjL_dChWsHjiEadhgV0R	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T05:40:34.994Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 05:40:35
-u5XOQnsOeH-1opMjacJBUO9aNP-msNH	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:32:08.374Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:32:09
2iMa--C4j31NELl2A0bIxSHquXQq5lyN	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:32:08.387Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:32:09
yNWaSbwqVg8LcoZa8N2DsAHG5Q__8mgr	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:32:08.395Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:32:09
dUOcFyIhlwWCk47ryGVK6ZARgzeZClJb	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:32:08.399Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:32:09
aZRwp70QWRhihk4w8dSfjkjmr5yirCCD	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:32:08.547Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:32:09
jOJOj7rTv0_oZ9llgzJEtECXA5EzXGK2	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:32:09.155Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:32:10
i5KPXH0r83SkE5o2v7WE5dGpM0-G6JLW	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:32:09.610Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:32:10
l2CDV-iT1fVIM24iUxlDhdaznYoQXuyz	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T05:43:00.664Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 05:43:01
yloK2DaJulDsvQImCcGm3oL4vt7M2a8C	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:32:16.145Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:32:17
ECd5vLqSiy473wpKWlv6t4fLC0jPfxod	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T07:04:31.117Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 07:04:32
LwnC-aU3CwaPRci8shwAQo9Pw4ieRMEE	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:07:58.147Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:07:59
jDvknE7KILqOpF6gMnWEDi4LJrpHbtui	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:42:36.526Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:42:37
Efdwf76h7lFz8fljxZfs_ziMYuyAVDRV	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:49:32.416Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:49:33
Yw-tFxYrYS5waM6SBlnsG78iSJh2RX-k	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:50:37.773Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:50:38
DfumTDKkBvG9yGliiF04QhXfGr_DQqoG	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:58:51.791Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:58:52
iHXyZ0U6DltuIo8I7nr33z0sMtBkHg2-	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:58:59.811Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:59:00
8gpodcX-vQOdHPZG72286soROngNvuK5	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T07:06:56.512Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 07:06:57
wyCn_ZrBUcbqxXBk_2W6D2vESBAIFcNu	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T06:17:03.645Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 06:17:04
MqQV_SuARUopA25E2-ZZmBRCa3BNVgKH	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:43:48.427Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:43:49
NmyvYeOrCrEcTWbOo-EXd0PA6daQLtjV	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:44:16.430Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:44:17
pNPMB7mloCODOXGjVioAbHsKrAD8E64o	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T07:07:01.104Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 07:07:05
j2XrDcdeXOX4EW7sBgaFGK2LNYRk5PvU	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T07:14:59.490Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 07:15:00
M9EE1ikDTXN15dBnqsvXgeGgdfujQZIf	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T07:15:38.329Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 07:15:47
D4k1WjwdDq18sy6BJhRaxuqTAt4pGNui	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T07:19:08.880Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 07:19:09
gZw76oFqph8Kw2_k7lL_luWa2uF0Yt96	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:14:14.468Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:14:15
xurK7Dq704N1Qf5lYdniC2F-mQbTJcNP	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:20:50.724Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:20:51
EbjMNNBMbyfI1iF4gwGT7evfCQh2xFaY	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:20:51.184Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:20:52
vDXdX67ANYlB7HYvtdyhROAJjrgGqsgO	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:20:51.618Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:20:52
QEOTZYeSCaWfGvnbvLPtHSPUU_YUYFlx	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:20:52.074Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:20:53
HSqorSWb-Grsw2NCcepBXqcYegxnFSTM	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:20:52.523Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:20:53
aJRmJQFwtYDQRuis3jf7fXSS373JbzLR	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:20:52.981Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:20:53
Lh_S05XNXTmO8wjZF0B5qo6LVZvEGuve	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:22:24.692Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:22:25
IdKwZjgx7uJzsPdYMer7RSI_xrisrIpd	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:23:56.002Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:23:57
grf_Yww-9ZnBdK6klhDmNbav5cKZJKFJ	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:24:59.609Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:25:00
UZ2Bpij3dlwu5m6k84AR_pVG_aF0MuD2	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:25:17.905Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:25:18
ZCmaBvMyIO6M8y6ndVSjhtWs65LyNvCF	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:26:00.010Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:26:01
x34sJ86v9qril81Tr6GXzfcjrrgMixCw	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:28:27.319Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:28:28
2FmD4cWwQdcH6yHxXe7Tgh3_i0kG1wjh	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:29:57.025Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:29:58
Md3NlGmSztZ-PFmhy-foq6_BX93Ee4XU	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:32:13.342Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:32:14
svUQxKpBAWOyBXH4hbsw6VZY1ZXgCE3V	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:32:52.744Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:32:53
EwddYh1jGvzciDuZ5nNaKCXGPES2sEIn	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:34:32.863Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:34:33
HxRqbMSkJaqkIytBLTdkq2dpVa_LxjR9	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:35:10.484Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:35:11
iKyNxja0xwW7Qww6UPe18_vAA2Hw9AzA	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:35:42.311Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:35:43
YlDNpgNn9966S9NQUJ3hmmK-zY02QZ9k	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:38:14.971Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:38:15
aC2mCk0amSAxkolCWiMhdRls-4LDyeot	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:38:38.941Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:38:39
kH9XK4Ux8E938AYZM6KUsX8lA9C0s4D8	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:40:29.163Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:40:30
ytmhv8wQCA2I5RTU5DXzKunZ0BOMRM9o	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:41:25.276Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:41:26
onzyXbimAeLPNuQfpqlKBqxJM1rhMxm7	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:47:00.506Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:47:01
3NxYfl_N8gpkYsI7gDQ2t3_j8ZRlW9CH	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:49:24.003Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:49:25
SYiHTqNP3SCfk2IQ-hPgCm-oqDj58vdB	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:50:06.063Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:50:07
Ju8TXtwP5q4hXVzKfF8uNkTxs7B_8w0I	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T08:59:34.438Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 08:59:35
qSYGYf6tvziZo-ATdMOUL8Z9XjgXVXxt	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T09:01:31.886Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 09:01:32
bvsGlO-xrLbcEqAN38K8qR5J0zJUsK7H	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T09:01:35.665Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 09:01:36
2-gwR7JCiCtkteQ063Qdskh0mnAQqSxA	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:21:50.006Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:21:51
fiU_Bxg8aeNNq7SXipl1p0yDeWGLavPZ	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:22:47.049Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:22:48
X__6wmP0XEeIrB_DWKhV4OT2surPM-S2	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:23:10.324Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:23:11
ag6f9R6E6HCI_TbYE4a4qUAsmpOUyRr_	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T09:01:56.572Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 09:02:04
YtfTMmOxKL2rNhQTCQgH2S_1c7sHI6f3	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T09:03:48.630Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 09:03:49
-SrVT4iuDmJMdBPCxRUPwexwQwud8x99	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T09:07:55.011Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 09:07:56
Ua1JMNr_pIwuAHf1ZLKikTq4KMPRAWSW	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T09:08:25.123Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 09:08:26
s29hZiRUJo_TiB9Y5WvjPgdUghLPEPDp	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T09:08:31.950Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 09:08:32
2_DJOmHaWYSLoFl4KdcS68ImPJjQGo6n	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:24:50.296Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:24:51
uBlWYN_4M4LYtT6XcZcNcrt-el0O1r7z	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:24:57.374Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:24:58
eXy76MDDqV8bJF5HJQkX3QMzP9CfZjlI	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:25:25.006Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:25:26
eMq6dP1XiUh-OW19usoSs_myJ1IJ91dT	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T09:08:52.905Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 09:09:03
FJVtnOL3aks6hG6dBV-zHN-sy5hJps8_	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T09:29:55.878Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 09:29:56
ENVwQJAAWhfXJ582L4mmZ2EeTSsJKgag	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T09:55:34.171Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 09:55:35
JHZf-WIX4E9ffTkHq7zbiahYTrC7DWWw	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T09:55:36.060Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 09:55:37
e_BbR_rxEvnIWYPv_1DO4k0vQnxey7_y	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:04:58.062Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:04:59
vpRcAqPn4Efey1NeL7vZ7skFcVg0lHdH	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:05:03.561Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:05:04
s9hUS6Fv_-uMfBMKqWtFgiOIueP9avNb	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:06:32.133Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:06:33
oeL68zn8TFgE1XL5fIG7TwpwHN_dVXIH	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:07:19.915Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:07:20
fPC81EUeEYopP5se47wGqqz1YJ633ZoM	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:07:52.203Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:07:53
0VKxrKTBgME0fVz_RVdCAFySO5TcBqjt	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:12:23.729Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:12:24
cz0ld5D2dIFK6vggoLnmUyz39Q4JpqRl	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:16:46.867Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:16:47
iUnEMdFB83nbkU33cRv9Cr54pM-_BQCu	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:16:47.637Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:16:48
pQXA-HiHT8U6F4YM00EiSunkJrVzWGSn	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:17:00.004Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:17:01
y7R_L7jKIvmOCVqDy9XP2xL4Td-m0awN	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:17:00.771Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:17:01
wLQFXRHtrGktXCPVZWFLDdZc_1LEEHOj	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:17:16.421Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:17:17
v9Rj0fe7k0U69JAOE_GH7ksNDW572vYU	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:17:54.666Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:17:55
DDSSLyORMMDGkvRAQTX4lPkW7xjNkZYT	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:28:52.698Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:28:53
ztYpflcWtyvoX69Je1vQqntoCydD9p9u	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:29:22.983Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:29:23
yOMZRLRNw52o1s-2F7-Z9FpEeidVXsgc	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:32:16.940Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:32:17
HndG3qKzam4H9ffdj-Ejf9FtbrfYl7D1	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:32:22.564Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:32:23
WLKDQj2fzfivdayAtvHJL3-0yqa6AtVI	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:33:54.896Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:33:55
VgEBAVCwOh_sd1UwBPgvaa89zSXCvImH	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:37:15.135Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:37:16
RtV550Ez3NKJj4hMISZ4Uj3kwkGavSKg	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:40:03.091Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:40:04
QGcJUsMwfLGydIvTjFqJBi4BCrlShm6K	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:40:46.168Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:40:47
uipSLtDxzsDRBGv988L7_nvDk7_4ALw4	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:42:41.448Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:42:42
ddzG3STuuZkTBRiG_XkSi281qIXtxn80	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:43:46.020Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:43:47
gWg5862wzCyrsEhif0n5I8Cqj1oaRpIY	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:43:51.523Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:43:52
ehtrdLiUnXSsRWLPtDAvsRpwlG-CbF5Z	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:46:22.183Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:46:23
ZhfmAqLjPOuAtDVh_zxFut6SkxWs4OUc	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:46:28.560Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:46:29
QkbamLmx9_qxqIfnCAGHXTAHxjazQzH6	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:59:30.276Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:59:31
lsuY9ceuAArtsAm0vfG1ews73yCpXj94	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T10:59:37.590Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 10:59:38
NPe_vXz-hbNDfIarlOApktcxhwFJCqFK	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T15:20:32.954Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 15:20:33
RQWQXm0lrwOjvJHReIoEsdOM0OmVpjmP	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T11:07:56.652Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 11:13:08
k7XatupY5FhF0UVRsLRZt6vdRx0GFNNz	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T11:24:19.530Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 11:24:20
IVzWtyBAJKu2TiU7gjNYQb9BM95_wCKo	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T11:44:15.233Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 11:44:16
c2Xv1HadIvJtRgJvMN7Vxggi84qkU1ce	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T11:44:23.378Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 11:44:24
1a0Nz5I9YlSpR7Ww_M7pa1sh8hQpi8ry	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T11:50:05.443Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 11:50:06
YjxfDGZMeYRHJvvUxWYHGraAicMlGfGY	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T11:57:23.429Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 11:57:24
AjMg3ufh6a3BTTBCrYu4_lKux4_-vxjb	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T12:04:09.926Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 12:04:10
zb8x5MTrsE7D-f0Zo1ZAls6Jt2BhyuPO	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T12:18:14.584Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 12:18:15
u-_OSchjnvZmoQMe2AFy-KAzxB2UehZY	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T11:00:43.653Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": 3}}	2025-09-20 11:01:26
8E3_IZepJkRfZGqR9FItqK38hDYbo-jG	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T11:07:56.198Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 11:07:57
caDBgg77pi0WPkibR5SuClevFIjnCQjE	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T12:31:09.598Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 12:31:10
WIuX7fdrNNgYQSImp1VTuF9KY5bclvMf	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T12:42:50.100Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 12:42:51
veFLb0-mFm1EJatzN-cyFkDv2r4Zj2mL	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T12:48:20.737Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 12:48:21
wB_DOHTwJE-J1rsdTFcz9k_Q11hNoD4M	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T12:59:32.195Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 12:59:33
3IHnmtOaDoQKyH66sYpbts7cxJsVuxLJ	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T13:07:41.800Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 13:07:42
xRcAUZO5eYzlSfY3iFz-iDHnhHH8P5hD	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T13:28:16.210Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 13:28:17
pOLsfVG7RnVvrYcAIGldyc4tgmQ4QTAL	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T13:30:23.328Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 13:30:24
zYA7dnrsAsJOoVMm9oBqIsWZ6N9nenHo	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T13:37:25.288Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 13:37:26
W8Klh-7C3TO4n3TQy3mdgOlO3UQAoh-W	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T13:37:37.673Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 13:37:38
LkdZVowsw8gXlkhfbW0CZiL5TGkgEazp	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T14:07:25.737Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 14:07:26
TYS_A6VSdXFKbyOTrdJkchiCfA2JJ5ag	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T14:07:33.166Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 14:07:37
eEkgD0xwmvUfGPztjkGf_3lNM0sB0cHn	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T14:11:53.142Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 14:11:54
e-U2jyHTAM8tcrQfrg53tU9VdSFI4XkE	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T14:25:30.946Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 14:25:31
OmudBooxR6of5AOZ6sxDiZUIHAqG6VWL	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T14:25:33.617Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 14:25:34
duRUkh2x8GLy0vZd_Y1HRQmPPji5BCAV	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T14:25:44.572Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 14:25:45
9u8u25QJ8v2_pY0PxivpbxY8NSNO6NjG	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T14:25:45.192Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 14:25:46
cE64k-dEFQ8OS3-PAVn2uO02mnwgNU_c	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T14:25:45.777Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 14:25:46
-V66Nbrl_ExMIXbMk8jEhw8Rz_6HlzdC	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T14:25:46.392Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 14:25:47
0LO7u-EbAhaho5ofDihuiIzbJVTA0L27	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T14:26:55.378Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 14:26:56
Vsxy8jsLdPJHgiL5YVe8MdZIWE2cec-b	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T14:38:34.821Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 14:38:35
R6pTP0-xNyepUSv5YF9UaHaHF8hPWyd8	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T16:17:55.775Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 16:17:57
mI9k2xEGuwe2l8v8jG52D2kE6v22SiRc	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T15:24:25.751Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 15:24:26
vSgV9SyRFgjQlQSIRNgPyL6rG16swWqz	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T15:24:27.659Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 15:24:28
segPsVjKa3uI2-L6BBrnOkRr-qgUISuZ	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T15:24:52.290Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 15:24:53
9EXuTUGkNJru1uA0rcefi57gISNJ0_D1	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T15:37:09.928Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 15:37:10
lckC42KOhGyvuC5kBMaiZ2QUCppKdhrc	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T15:44:41.365Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 15:44:42
2fivqtiCgZEen3mJ5jvBwPDG0lKGfDxN	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T15:49:08.948Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 15:49:10
Lu5GMXLBSkQNNG8mAJh056uyOq_pE5u6	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T15:54:16.962Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 15:54:17
6JiJR6HOVeYjVZl8VGnuNAATAbO6hJH8	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T15:57:58.594Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 15:57:59
1ttZXrjhYeGprF0TnkDv6rTV3Xs3o0yW	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T15:58:02.546Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 15:58:03
eMm6ebrjQUyjkBG8pvZ1z9vOjgstTrPu	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T16:17:58.283Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 16:17:59
jSIoGQJsokmAKzHLiKtD1UMUxC8k5lgm	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T15:01:04.519Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": 3}}	2025-09-20 16:12:04
C3DeLcPFaT57DLenjXkpifmm2yS-VsYM	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T16:18:00.301Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 16:18:01
sCJ246EmWuS6R-Qr-fGvFXO6rFQ_j2DV	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T16:18:02.100Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 16:18:03
lJZwqagnlaDcGugxqbeF5kkD4Wu4CsN5	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T16:49:28.046Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 16:49:29
MFuBdP9lCG8X3kg9nEpymLptXe-AtJQG	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T17:15:33.901Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 17:15:34
nKlG95iDglh490radYM-Y-v2cLFxJ768	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T17:51:06.522Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 17:51:07
VF9RdlMcn05VINALyax0sv8vfZB0pujj	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T18:04:24.012Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 18:04:25
tuc08DRW_ttFqtIVUgRoolPjbkbteLlR	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T18:06:26.022Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 18:06:27
bLf8WmFtkhh1CGkoA7czmOqXqmY_GVmW	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T18:24:45.141Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 18:24:46
WNQ0un4q89G5rRBjdnBgqXap291zs13S	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T19:10:59.874Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 19:11:00
4SsngcIJrQpbZft4AVp8jmHhguRJvk72	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T19:15:20.717Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 19:15:21
f8ZV2RrZk0OMRhmPIFzCf6Lyle5OAQar	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T19:15:41.644Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 19:15:42
uuVwv9mh64wdHi96ef-B6OulncpeO9QU	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T19:17:38.016Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 19:17:39
DIohLjE3FYoNaZULYi396WrfY44tfnxE	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T19:17:39.718Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 19:17:40
qO3WYo_wSe_rO8YN-DYaVv5xPamv7E8u	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T19:18:01.423Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 19:18:02
LHHLC67SMa703ZHvZmloPf1H8Yf-ofiZ	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T19:35:43.544Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 19:35:44
yREmXlA-MamHHXmkDm9Hg-4dqDPP6xfM	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T20:14:37.505Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 20:14:38
TfXf0nVH9iCqWJ84iiYuJXTraEJOzNg5	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T20:25:27.416Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 20:25:28
U8CAMEjKhHNFnZ6U7ZnnOoVkAnf-oqcI	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T20:25:28.797Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 20:25:29
UQiNBV61ShbOCWGKRP_J0pdEdkEo9lN5	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T20:43:10.342Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 20:43:11
BmfNdIR9veyT_1Fuo4JHgtUST93v4oBv	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T20:56:52.101Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 20:56:53
xyqqfaWzEftm0zsdIErCvYulpsuiCZqH	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T20:57:05.859Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 20:57:06
GNMBmqv1LWDr7WyPYlhKbvemWogfcQ2Q	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T21:19:29.799Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 21:19:30
TeVqYbrvQQKlEvuWzyb-qcm5znl5rID4	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T21:19:29.809Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 21:19:30
Wxyqpjgxdog2BRNkJdUNZ-_4jgbBzMpg	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T21:19:29.816Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 21:19:30
mMsU9tkaQ-YdRQYKg4Q3umH_px9ygYeH	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T21:19:29.824Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 21:19:30
rn3_5yVxveA78p7cekH-hmr3Q5I8gaWn	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T21:19:53.685Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 21:19:54
UB0UbrH8vCe61rzhyrfY6H0wU16L-fsG	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T21:19:53.695Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 21:19:54
MG3BbU1vDG9LvYp-Dh_zlWWmKMA5ujN2	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T21:19:53.702Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 21:19:54
nfIUz1nafV0K83pc31969kN4HE2rZsvm	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T13:42:37.839Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": 3}}	2025-09-21 01:47:18
wTOUaEgtWrswdEResX9uZDs4kbm-CjS3	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T21:19:53.709Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 21:19:54
JjOknera8l_pE3Lm2NM6opQr-av3xaqT	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T21:21:09.782Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 21:21:10
nAZZyxiGuZMGHIal07SrBUZ9xarhNO9x	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T21:22:14.492Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 21:22:15
cEHV9o6c-b6syDQtkjVtfX-LChuWnH-R	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T21:25:13.873Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 21:25:14
EM3BRU3Cvw834U3MCJZBYjERum21oBdp	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-20T21:27:12.333Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-20 21:27:13
_RBMNKiKJeLoG939LAwtiFgqb0Tj5Nbw	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-21T01:33:27.053Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-21 01:33:28
yRWC-rqshk8r5ek4V59zht9QmeTBtiAN	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-21T01:34:57.818Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-21 01:34:58
3UtPlZQGPbY6S4TiHuu05LHmXmf3w7qp	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-21T01:35:11.661Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-21 01:35:20
jYNbYuwgRxwgLX8eMhOH84zIBu6fIyW1	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-21T01:38:41.583Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-21 01:38:42
KICiFEZ6bhLCKIqMC_PKGsOuR6bl5NAN	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-21T01:38:58.136Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-21 01:38:59
NdH3RzOyvIoFg5Y7P-EKbdSUzDhGSwTb	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-21T01:40:11.148Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": 3}}	2025-09-21 01:41:19
EXntdLSmXmW8iTUPMVo7SjwY9cY_GYh3	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-21T01:46:28.905Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-21 01:46:29
77asD5LxsGJjoAjvq35-c4wuU5oXRDHk	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-21T01:46:44.283Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-21 01:46:45
4gLeUGFgJGZ-yH8LbZkbAe4NwVUDz5gf	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-21T01:40:18.405Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-21 01:40:19
sXupHRGoyPdvqAQeDGkt3Gz_4gl7EmJb	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-21T01:48:04.031Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-21 01:48:05
MGP4kjO_KPzXsHhegFVXzaWBlD65KDCD	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-21T01:40:37.454Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-21 01:40:38
7RuiK34Cvc9022c-4b3BL9DPB_8gZucI	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-21T01:48:48.851Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-21 01:48:49
3ZV1H_MM9Z69W2YbZ2BfDSPgD_81BLo1	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-21T01:49:38.330Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-09-21 01:49:39
\.


--
-- TOC entry 2257 (class 0 OID 16412)
-- Dependencies: 198
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: cloud_cost_user
--

COPY public.users (id, email, password, first_name, last_name, created_at, updated_at, profile_image_url) FROM stdin;
2	darbhasantosh11@gmail.com	b0rLicsU.WaanFFEGUYMdX.E8fAYsQonKV2QuqIY0jSmQQ9uBkfALq	Santosh	Gurudarbha	2025-09-13 05:10:35.515645	2025-09-13 05:10:35.515645	\N
3	santosh@xyz.com	$2b$10$aI/p8ljBBC0FQCmgiHvXdu5PzhISr8sbAJuKpFtd63tM0sZDhbY.a	Venkatanagasaigurusantosh	Darbha	2025-09-13 05:13:45.35235	2025-09-13 05:13:45.35235	\N
\.


--
-- TOC entry 2281 (class 0 OID 0)
-- Dependencies: 199
-- Name: cloud_credentials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cloud_cost_user
--

SELECT pg_catalog.setval('public.cloud_credentials_id_seq', 10, true);


--
-- TOC entry 2282 (class 0 OID 0)
-- Dependencies: 203
-- Name: cost_analyses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cloud_cost_user
--

SELECT pg_catalog.setval('public.cost_analyses_id_seq', 1, false);


--
-- TOC entry 2283 (class 0 OID 0)
-- Dependencies: 201
-- Name: inventory_scans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cloud_cost_user
--

SELECT pg_catalog.setval('public.inventory_scans_id_seq', 51, true);


--
-- TOC entry 2284 (class 0 OID 0)
-- Dependencies: 197
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cloud_cost_user
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- TOC entry 2126 (class 2606 OID 16437)
-- Name: cloud_credentials cloud_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: cloud_cost_user
--

ALTER TABLE ONLY public.cloud_credentials
    ADD CONSTRAINT cloud_credentials_pkey PRIMARY KEY (id);


--
-- TOC entry 2130 (class 2606 OID 16473)
-- Name: cost_analyses cost_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: cloud_cost_user
--

ALTER TABLE ONLY public.cost_analyses
    ADD CONSTRAINT cost_analyses_pkey PRIMARY KEY (id);


--
-- TOC entry 2128 (class 2606 OID 16455)
-- Name: inventory_scans inventory_scans_pkey; Type: CONSTRAINT; Schema: public; Owner: cloud_cost_user
--

ALTER TABLE ONLY public.inventory_scans
    ADD CONSTRAINT inventory_scans_pkey PRIMARY KEY (id);


--
-- TOC entry 2120 (class 2606 OID 16399)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: cloud_cost_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- TOC entry 2122 (class 2606 OID 16424)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: cloud_cost_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 2124 (class 2606 OID 16422)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: cloud_cost_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 2118 (class 1259 OID 16409)
-- Name: idx_sessions_expire; Type: INDEX; Schema: public; Owner: cloud_cost_user
--

CREATE INDEX idx_sessions_expire ON public.sessions USING btree (expire);


--
-- TOC entry 2131 (class 2606 OID 16487)
-- Name: cloud_credentials cloud_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cloud_cost_user
--

ALTER TABLE ONLY public.cloud_credentials
    ADD CONSTRAINT cloud_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 2133 (class 2606 OID 16474)
-- Name: cost_analyses cost_analyses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cloud_cost_user
--

ALTER TABLE ONLY public.cost_analyses
    ADD CONSTRAINT cost_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 2132 (class 2606 OID 16456)
-- Name: inventory_scans inventory_scans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cloud_cost_user
--

ALTER TABLE ONLY public.inventory_scans
    ADD CONSTRAINT inventory_scans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 2271 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT ALL ON SCHEMA public TO cloud_cost_user;


-- Completed on 2025-09-20 03:35:10 UTC

--
-- PostgreSQL database dump complete
--

