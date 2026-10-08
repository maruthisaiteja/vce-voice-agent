# College information and enquiry workflow

Live workspace: https://vce-voice-agent-eight.vercel.app

## Add college documents

1. Sign in with the private staff access key. Open **Verified knowledge**.
2. In **College document library**, expand **Upload a document or paste information**.
3. Enter a descriptive title, responsible department, effective date and review/expiry date. Include programme, academic year and notice version in the title where relevant.
4. Upload a text PDF, DOCX, TXT or Markdown file, or paste the official notice. Maximum 3 MB and 200,000 extracted characters per document. The library stores extracted text, not the original file. Keep originals in the college's document repository. Scans need checked OCR text. Never upload private student records or credentials here.
5. Select **Save document for review**. Read the extracted text, especially tables, dates and amounts. For long documents review each numbered section.
6. Select **Suggest answers from this section**. This sends that section to the configured Sarvam API and proposes up to eight questions. It does not publish them and does not guarantee exhaustive coverage.
7. Compare the supporting quotation, question, English answer and translations. Select **Review and save this draft**, correct it, then save.
8. In the knowledge list select **Approve** only after checking the full notice, exceptions and translation accuracy. The live agent can use the approved answer immediately; no Sarvam recommit is required.
9. Test the question in **Conversation lab**, including ambiguous questions and English/Telugu/Hindi variants. Approving an English answer alone does not guarantee translated answers.

For revised notices, withdraw the old document and upload its replacement. **Withdraw document and linked answers** removes all linked answers from caller use. Linked answers cannot be reapproved while their document is withdrawn, and their validity cannot exceed the document's dates. Expired answers are withheld.

This is source-grounded retrieval, not model-weight training. The call model selects from current approved answers; it must not invent college facts. Uploading alone does not make every sentence answerable. The library is a bounded pilot workflow: for very large collections, plan background ingestion and indexed multilingual retrieval with measured recall/latency before promising complete coverage.

## Add department mail addresses

1. Open **Department emails** → **HOD & office recipients**.
2. Expand the relevant department, such as Admissions, Examination Branch, Accounts or CSE.
3. Enter **Recipient name / office**, **Official email**, and an **Official source URL** (HTTPS).
4. Verify the address against the college directory, check the confirmation box, then choose **Save recipient**. Verification lasts 30 days; recheck it when expired or staffing changes.

These addresses route email. **Department routing** separately controls phone destinations and office hours.

## Where requests go

- **Call history**: saved college questions, backend answers, source references and call status. This is not a full audio recording or a verbatim transcript of every Sarvam utterance.
- **Verified knowledge → Unresolved questions**: questions where an approved answer was not available or a staff-only/conflicting topic needed review.
- **Staff requests**: office follow-up requests created with caller consent. Saving one does not send an email or connect a call.
- **Department emails → Email outbox**: email drafts created after caller confirmation and consent. Missing/unverified recipient addresses are visibly flagged.

To send a draft: **Review message** → inspect content → **Approve message & current recipient** → reopen the draft → **Send reviewed email**. SMTP acceptance is recorded; it is not a guarantee of inbox delivery. Automatic sending is not enabled. No college employee is emailed simply because a caller asked an unanswered question.

No new environment variables are required for the document library. Existing Turso, Sarvam and SMTP settings are reused. Migration 0005 creates the document table during deployment.
