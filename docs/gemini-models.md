# Gemini API Model Snapshot

_Source: [Gemini API models reference](https://ai.google.dev/gemini-api/docs/models/gemini), retrieved during investigation._

## Generally available models
- `gemini-2.5-pro` (stable tier for advanced reasoning)
- `gemini-2.5-flash` (primary fast multimodal model)
- `gemini-2.5-flash-lite` (low-latency/lightweight tier)
- `gemini-2.0-flash` (previous-gen fast model; stable `gemini-2.0-flash-001` also available)
- `gemini-2.0-flash-lite` (includes stable `gemini-2.0-flash-lite-001`)
- `gemini-2.0-flash-live-001` (real-time live interactions)

## Preview & specialized variants
- `gemini-2.5-pro-preview-tts` (text-to-speech reasoning)
- `gemini-2.5-flash-preview-09-2025` (long-context preview)
- `gemini-2.5-flash-lite-preview-09-2025` (lite preview tier)
- `gemini-2.5-flash-image` and `gemini-2.5-flash-image-preview` (image generation)
- `gemini-2.5-flash-preview-tts` (flash voice synthesis)
- `gemini-2.5-flash-preview-native-audio-dialog` (voice dialog preview)
- `gemini-2.5-flash-native-audio-preview-09-2025` (native audio preview)
- `gemini-2.5-flash-exp-native-audio-thinking-dialog` (experimental voice dialog)
- `gemini-2.0-flash-preview-image-generation` (image generation preview)

## Compatibility aliases
- `gemini-flash-latest` (alias to the latest flash release)

These names map directly to the REST resource path format `models/{modelId}` when configuring the Gemini client library.
