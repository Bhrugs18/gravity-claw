/**
 * Simple tool to get current local time.
 */
export const getTimeTool = {
    name: "get_current_time",
    description: "Get the current local time.",
    input_schema: {
        type: "object",
        properties: {},
        required: [],
    },
};

export async function executeGetTime() {
    return new Date().toLocaleString();
}
