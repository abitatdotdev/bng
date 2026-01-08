#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { allHabitats } from "../src/habitats.js";

type HabitatData = typeof allHabitats;
type HabitatKey = keyof HabitatData;
type Habitat = HabitatData[HabitatKey];

const server = new McpServer(
    {
        name: "habitat-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List habitats tool
server.registerTool(
    "list_habitats",
    {
        description: "List all available habitats with optional filtering by broad habitat type, distinctiveness, or other criteria",
        inputSchema: z.object({
            broadHabitat: z.string().optional().describe("Filter by broad habitat type"),
            distinctivenessCategory: z.string().optional().describe("Filter by distinctiveness category (Low, Medium, High, V.High)"),
            irreplaceable: z.boolean().optional().describe("Filter by irreplaceable status"),
            limit: z.number().optional().default(50).describe("Maximum number of results to return"),
        }),
    },
    async (args) => {
        const { broadHabitat, distinctivenessCategory, irreplaceable, limit = 50 } = args || {};

        let habitats = Object.entries(allHabitats);

        if (broadHabitat) {
            habitats = habitats.filter(([_, h]) => h.broadHabitat === broadHabitat);
        }

        if (distinctivenessCategory) {
            habitats = habitats.filter(
                ([_, h]) => h.distinctivenessCategory === distinctivenessCategory
            );
        }

        if (irreplaceable !== undefined) {
            habitats = habitats.filter(([_, h]) => h.irreplaceable === irreplaceable);
        }

        const results = habitats.slice(0, limit).map(([_, habitat]) => ({
            label: habitat.label,
            code: habitat.code,
            broadHabitat: habitat.broadHabitat,
            type: habitat.type,
            distinctivenessCategory: habitat.distinctivenessCategory,
            distinctivenessScore: habitat.distinctivenessScore,
            irreplaceable: habitat.irreplaceable,
        }));

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            total: habitats.length,
                            limit,
                            results,
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }
);

// Get habitat tool
server.registerTool(
    "get_habitat",
    {
        description: "Get detailed information about a specific habitat by its code or exact label",
        inputSchema: z.object({
            code: z.string().optional().describe("The habitat code (e.g., 'c1a7')"),
            label: z.string().optional().describe("The exact habitat label"),
        }),
    },
    async (args) => {
        const { code, label } = args || {};

        if (!code && !label) {
            throw new Error("Either 'code' or 'label' parameter is required");
        }

        let habitat: Habitat | undefined;

        if (code) {
            const entry = Object.entries(allHabitats).find(([_, h]) => h.code === code);
            habitat = entry?.[1];
        } else if (label) {
            habitat = allHabitats[label as HabitatKey];
        }

        if (!habitat) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            { error: "Habitat not found", code, label },
                            null,
                            2
                        ),
                    },
                ],
                isError: true,
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(habitat, null, 2),
                },
            ],
        };
    }
);

// Search habitats tool
server.registerTool(
    "search_habitats",
    {
        description: "Search for habitats by keyword in their label, type, or description",
        inputSchema: z.object({
            query: z.string().describe("Search query to match against habitat labels, types, and descriptions"),
            limit: z.number().optional().default(20).describe("Maximum number of results to return"),
        }),
    },
    async (args) => {
        const { query, limit = 20 } = args || {};

        if (!query) {
            throw new Error("'query' parameter is required");
        }

        const searchTerm = query.toLowerCase();
        const results = Object.entries(allHabitats)
            .filter(([_, habitat]) => {
                return (
                    habitat.label.toLowerCase().includes(searchTerm) ||
                    habitat.type.toLowerCase().includes(searchTerm) ||
                    habitat.description.toLowerCase().includes(searchTerm) ||
                    habitat.code.toLowerCase().includes(searchTerm)
                );
            })
            .slice(0, limit)
            .map(([_, habitat]) => ({
                label: habitat.label,
                code: habitat.code,
                broadHabitat: habitat.broadHabitat,
                type: habitat.type,
                distinctivenessCategory: habitat.distinctivenessCategory,
                description: habitat.description || "(No description)",
            }));

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            query,
                            count: results.length,
                            results,
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }
);

// Get habitat statistics tool
server.registerTool(
    "get_habitat_statistics",
    {
        description: "Get statistics about the habitat dataset, including counts by broad habitat, distinctiveness, and difficulty levels",
    },
    async () => {
        const habitats = Object.values(allHabitats);

        const stats = {
            totalHabitats: habitats.length,
            byBroadHabitat: {} as Record<string, number>,
            byDistinctivenessCategory: {} as Record<string, number>,
            byTechnicalDifficultyCreation: {} as Record<string, number>,
            byTechnicalDifficultyEnhancement: {} as Record<string, number>,
            irreplaceable: {
                true: 0,
                false: 0,
            },
        };

        habitats.forEach((habitat) => {
            stats.byBroadHabitat[habitat.broadHabitat] =
                (stats.byBroadHabitat[habitat.broadHabitat] || 0) + 1;

            stats.byDistinctivenessCategory[habitat.distinctivenessCategory] =
                (stats.byDistinctivenessCategory[habitat.distinctivenessCategory] || 0) + 1;

            stats.byTechnicalDifficultyCreation[habitat.technicalDifficultyCreation] =
                (stats.byTechnicalDifficultyCreation[habitat.technicalDifficultyCreation] || 0) + 1;

            stats.byTechnicalDifficultyEnhancement[habitat.technicalDifficultyEnhancement] =
                (stats.byTechnicalDifficultyEnhancement[habitat.technicalDifficultyEnhancement] || 0) + 1;

            stats.irreplaceable[habitat.irreplaceable ? "true" : "false"] += 1;
        });

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(stats, null, 2),
                },
            ],
        };
    }
);

// Get broad habitats tool
server.registerTool(
    "get_broad_habitats",
    {
        description: "Get a list of all unique broad habitat types",
    },
    async () => {
        const broadHabitats = Array.from(
            new Set(Object.values(allHabitats).map((h) => h.broadHabitat))
        ).sort();

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            count: broadHabitats.length,
                            broadHabitats,
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }
);

// Get habitat conditions tool
server.registerTool(
    "get_habitat_conditions",
    {
        description: "Get available conditions and temporal multipliers for a specific habitat",
        inputSchema: z.object({
            code: z.string().describe("The habitat code (e.g., 'c1a7')"),
        }),
    },
    async (args) => {
        const { code } = args || {};

        const entry = Object.entries(allHabitats).find(([_, h]) => h.code === code);
        if (!entry) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ error: "Habitat not found", code }, null, 2),
                    },
                ],
                isError: true,
            };
        }

        const habitat = entry[1];

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            code: habitat.code,
                            label: habitat.label,
                            conditions: habitat.conditions,
                            temporalMultipliers: habitat.temporalMultipliers,
                            enhancementTemporalMultipliers: habitat.enhancementTemporalMultipliers,
                            conditionAssessmentNotes: habitat.conditionAssessmentNotes,
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Habitat MCP server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
