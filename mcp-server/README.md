# Habitat MCP Server

An MCP (Model Context Protocol) server that provides Claude with access to the UK habitat biodiversity data from the BNG (Biodiversity Net Gain) system.

## Features

The server provides six tools for accessing habitat data:

### 1. `list_habitats`
List all available habitats with optional filtering.

**Parameters:**
- `broadHabitat` (optional): Filter by broad habitat type (e.g., 'Cropland', 'Grassland', 'Woodland')
- `distinctivenessCategory` (optional): Filter by distinctiveness category (e.g., 'Low', 'Medium', 'High', 'Very High')
- `irreplaceable` (optional): Filter by irreplaceable status (boolean)
- `limit` (optional): Maximum number of results to return (default: 50)

### 2. `get_habitat`
Get detailed information about a specific habitat.

**Parameters:**
- `code` (optional): The habitat code (e.g., 'c1a7')
- `label` (optional): The exact habitat label

*Note: Either `code` or `label` must be provided*

### 3. `search_habitats`
Search for habitats by keyword.

**Parameters:**
- `query` (required): Search query to match against habitat labels, types, and descriptions
- `limit` (optional): Maximum number of results to return (default: 20)

### 4. `get_habitat_statistics`
Get statistics about the habitat dataset, including counts by broad habitat, distinctiveness, and difficulty levels.

**Parameters:** None

### 5. `get_broad_habitats`
Get a list of all unique broad habitat types.

**Parameters:** None

### 6. `get_habitat_conditions`
Get available conditions and temporal multipliers for a specific habitat.

**Parameters:**
- `code` (required): The habitat code (e.g., 'c1a7')

## Setup

### Running the Server

You can run the MCP server using the npm script:

```bash
bun run mcp:habitat
```

Or directly:

```bash
bun run mcp-server/habitat-server.ts
```

### Configuring Claude Desktop

This project includes a `.claude.json` configuration file that automatically configures the MCP server when you open the project in Claude Desktop or Claude Code.

Alternatively, you can manually add it to your global Claude Desktop MCP configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "habitat": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/bng/mcp-server/habitat-server.ts"]
    }
  }
}
```

Replace `/absolute/path/to/bng` with the actual absolute path to your project directory.

### Configuring with other MCP Clients

For other MCP clients, configure them to run:
```bash
bun run /absolute/path/to/bng/mcp-server/habitat-server.ts
```

The server communicates via stdio (standard input/output).

## Data Source

The habitat data is sourced from `src/habitats.ts`, which contains comprehensive information about UK habitats including:

- Habitat classifications (broad habitat, type, codes)
- Distinctiveness categories and scores
- Technical difficulty ratings for creation and enhancement
- Condition assessments
- Temporal multipliers
- Irreplaceability status

## Example Usage

Once configured, you can ask Claude questions like:

- "What habitats are in the Cropland category?"
- "Find habitats related to woodland"
- "Get statistics about the habitat dataset"
- "What are the conditions for habitat code c1a7?"
- "Search for grassland habitats with high distinctiveness"

## Development

The server is built using:
- **Bun** - JavaScript runtime and package manager
- **@modelcontextprotocol/sdk** - MCP SDK for TypeScript
- **TypeScript** - Type safety

## License

Private project.
