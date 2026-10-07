# Cost model

Vendor rates and the winning voice stack are not locked. No invented subscription or minute prices are presented as current quotations. Use current provider invoices/quotations and compare on actual billed minutes.

Monthly variable cost = connected call minutes × (carrier inbound + speech/voice + reasoning + transfer bridge + recording) + SMS count × SMS rate + email count × email rate.

Connected call minutes = calls/day × days/month × average connected minutes/call.

Illustrative volume only: 300 calls/day × 26 days × 3 minutes = 23,400 minutes/month. At an assumed all-in ₹2/min the variable total would be ₹46,800; at assumed ₹5/min it would be ₹117,000. These rates are sensitivity inputs, not provider pricing.

Add phone-number rental, hosting, database/blob storage, support/review staffing, GST where applicable, and two-leg staff conference charges. Some voice vendors bill input/output tokens rather than whole minutes, so calculate cost from measured audio/token usage across representative calls. Silence, hold time and transferred-call charging differ by carrier. Cache stable prompts where supported, keep answers brief, limit unnecessary tool calls, and end abandoned sessions.

Benchmark cost per **correctly resolved call**, not simply lowest minute price. Track maximum concurrent calls and provider quotas; average daily volume does not establish admission-season peak capacity.

## Measurement status for this continuation

No live provider usage or invoice costs were collected. Synthetic HTTP and browser UI checks cannot establish cost or provider ranking. For each authorized benchmark turn record mode, model, language, source IDs, correctness, pronunciation errors, interruption delay, true end-of-speech and first useful audio timestamps, input/output audio duration, provider usage and billed currency/rate date. Keep mocked, browser-preview and live results separate. UI latency is a labeled device-event estimate and includes hearing-confirmation time; it does not measure acoustic buffering. Use cost per correctly resolved call in the comparison.
