CREATE TABLE "presence_sessions" (
	"nexconn_user_id" text NOT NULL,
	"session_id" text NOT NULL,
	"online" boolean NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "presence_sessions_nexconn_user_id_session_id_pk" PRIMARY KEY("nexconn_user_id","session_id")
);
