import { tool } from "@opencode-ai/plugin"

export default tool({
    description: "Execute Lua code",
    args: {
        code: tool.schema.string().describe("Code to execute"),
    },
    async execute(args) {
        const result = await Bun.$`lua .opencode/tool/run.lua ${args.code}`.text()
        return result.trim()
    },
})
