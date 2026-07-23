# Taskclan Achilleon — Claude Code commands

Drop the `.md` files in this directory into your project's `.claude/commands/` directory.

    mkdir -p .claude/commands
    cp *.md .claude/commands/

Claude Code auto-registers each file as a slash command. `debug.md` becomes `/debug`.

The `agent-` prefix on some commands (`hacker`, `architect`, etc.) marks them as
locked-personality agents rather than one-shot skills. In Claude Code they work
identically to skills — the distinction only matters in editors with a
sub-participant concept.

Source: github.com/taskclan/achilleon
