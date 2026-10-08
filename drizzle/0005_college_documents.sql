CREATE TABLE college_documents (
 id TEXT PRIMARY KEY,
 title TEXT NOT NULL,
 filename TEXT NOT NULL,
 department TEXT NOT NULL,
 content TEXT NOT NULL,
 digest TEXT NOT NULL,
 effective_from TEXT NOT NULL,
 expires_on TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'active',
 created_by TEXT NOT NULL,
 created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX college_documents_created ON college_documents(created_at);
