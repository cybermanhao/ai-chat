// Type guard to check if a chunk has platform-specific features
export function isPlatformChunk(chunk, field) {
    return chunk.choices.length > 0 && field in (chunk.choices[0]?.delta || {});
}
// Type guard specifically for Deepseek features
export function isDeepseekChunk(chunk) {
    return chunk.choices.length > 0 && 'reasoning_content' in (chunk.choices[0]?.delta || {});
}
