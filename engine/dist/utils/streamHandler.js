export async function handleResponseStream(stream, onChunk, onDone) {
    let content = '';
    let reasoning_content = '';
    let tool_content = '';
    let observation_content = '';
    let thought_content = '';
    const status = 'generating';
    try {
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            if (!delta)
                continue;
            if (delta.reasoning_content !== null && delta.reasoning_content !== undefined && delta.reasoning_content !== 'null') {
                reasoning_content += delta.reasoning_content;
            }
            if (delta.tool_content !== null && delta.tool_content !== undefined && delta.tool_content !== 'null') {
                tool_content += delta.tool_content;
            }
            if (delta.observation_content !== null && delta.observation_content !== undefined && delta.observation_content !== 'null') {
                observation_content += delta.observation_content;
            }
            if (delta.thought_content !== null && delta.thought_content !== undefined && delta.thought_content !== 'null') {
                thought_content += delta.thought_content;
            }
            if (delta.content !== null && delta.content !== undefined && delta.content !== 'null') {
                content += delta.content;
            }
            onChunk?.({
                content,
                reasoning_content: reasoning_content || undefined,
                tool_content: tool_content || undefined,
                observation_content: observation_content || undefined,
                thought_content: thought_content || undefined,
                status
            });
        }
        content = content.replace(/null/g, '');
        reasoning_content = reasoning_content.replace(/null/g, '');
        tool_content = tool_content.replace(/null/g, '');
        observation_content = observation_content.replace(/null/g, '');
        thought_content = thought_content.replace(/null/g, '');
        onDone?.({
            content,
            reasoning_content: reasoning_content || undefined,
            tool_content: tool_content || undefined,
            observation_content: observation_content || undefined,
            thought_content: thought_content || undefined
        });
    }
    catch (error) {
        throw error;
    }
}
export async function* streamHandler(response) {
    const decoder = new TextDecoder();
    const reader = response.body?.getReader();
    let buffer = '';
    if (!reader)
        return;
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
            const chunkStr = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 2);
            if (chunkStr.startsWith('data:')) {
                const jsonStr = chunkStr.replace(/^data:\s*/, '');
                if (jsonStr === '[DONE]')
                    break;
                try {
                    const chunk = JSON.parse(jsonStr);
                    yield chunk;
                }
                catch (e) {
                    // ignore parse error
                }
            }
            boundary = buffer.indexOf('\n\n');
        }
    }
}
