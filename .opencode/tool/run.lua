-- run.lua
-- Usage:
--   lua run.lua "return 1 + 2"

local code = table.concat(arg, " ")

if code == "" then
	io.stderr:write("No Lua code provided\n")
	os.exit(1)
end

-- Lua 5.1 / 5.2+ compatibility
local loader = loadstring or load

local chunk, compile_err = loader(code)
if not chunk then
	io.stderr:write("Compile error: ", compile_err, "\n")
	os.exit(1)
end

local results = { pcall(chunk) }
local ok = table.remove(results, 1)

if not ok then
	io.stderr:write("Runtime error: ", results[1], "\n")
	os.exit(1)
end

for i, v in ipairs(results) do
	if i > 1 then
		io.write("\t")
	end
	io.write(tostring(v))
end

if #results > 0 then
	io.write("\n")
end
