# Call review: specific answers and context

The call `3774ae1a` exposed lost department context, missing public knowledge,
student societies confused with academic branches, and overly broad exam matching.

Verified official sources on 8 October 2026:

- https://it.vardhaman.org/ — IT programme, intake, study areas, faculty expertise,
  HOD identity and explicitly published contact number. The page has inconsistent
  faculty qualification totals and lab counts; those numbers were not imported.
- https://vardhaman.org/programmes/ — B.Tech admission routes. No individual
  admission eligibility, seat availability or deadline inferred.
- https://vardhaman.org/student-affairs/ — named technical and cultural clubs.
  No current event dates, joining fees or registration availability inferred.
- https://cse.vardhaman.org/ — IEEE chapters and CETA activities, explicitly
  attributed to CSE rather than all departments.
- https://examination.vardhaman.org/ — administrative examination process.
  Programme/regulation-specific marks and pass rules are not in this answer.

Eight new source-linked answers, with English/Telugu/Hindi text, are inserted
once on application initialization. They expire for review on 7 November 2026.
Insertion does not overwrite existing edits or restore withdrawn records.

The backend returns exact curated text. These fixes change information coverage
and contextual matching, not the speaker model. No audio naturalness, pronunciation
or interruption-quality claim follows from a JSON call export.

Regression checks replay the nine caller turns in order, require the expected
source for each answer, and check that specific unknown dates, fees and exam rules
are not answered with generic descriptions. Exports preserve insertion order for
turns sharing a timestamp.
