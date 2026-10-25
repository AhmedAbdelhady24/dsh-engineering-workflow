#!/usr/bin/env python3
"""Derive a version-compatible DSH preset bundle from an inspected installed preset.

Intentionally refuses to guess if anchors are absent. Keeps the upstream tool graph.
Run: python tools/build-patch.py path/to/standard.patch.yml
"""
import pathlib, re, sys
root=pathlib.Path(__file__).resolve().parents[1]
if len(sys.argv)!=2:
    sys.exit('Usage: python tools/build-patch.py /path/to/standard.patch.yml')
src=pathlib.Path(sys.argv[1]).read_text()
if not re.search(r'(?m)^\s*- id: preset-standard\s*$',src):
    sys.exit('Expected preset-standard declaration in source; refuse to patch unknown format')
if not re.search(r'(?m)^\s*id: standard\s*$',src):
    sys.exit('Expected standard config id; refuse to patch unknown format')
if 'skill-filesystem' not in src or 'compaction-basic' not in src:
    sys.exit('Required skill-filesystem and compaction-basic components missing; inspect DSH version')
# Unique replacement of preset id and config id.
src= re.sub(r'(?m)^(\s*- id: )preset-standard\s*$',r'\1preset-engineering-workflow',src,count=1)
src= re.sub(r'(?m)^(\s*id: )standard\s*$',r'\1engineering-workflow',src,count=1)
# Limit the name/description mutation to top-level preset declaration config fields.
lines=src.splitlines(keepends=True)
for i,line in enumerate(lines):
    if re.match(r'^\s*id: engineering-workflow\s*$',line):
        # append new descriptive fields directly after ID; inherited order is okay.
        indent=re.match(r'^(\s*)',line).group(1)
        lines.insert(i+1,indent+'name: Engineering Workflow\n'+indent+'description: Planner, Executor, Reviewer, verified gates and context hygiene.\n')
        break
src=''.join(lines)
# Change compaction policy ONLY inside the compaction-basic row's config block.
anchor=re.search(r'(?m)^(\s*)- id: compaction-basic\s*$',src)
if not anchor: sys.exit('Could not locate compaction-basic row')
start=anchor.end()
nextpeer=re.search(r'(?m)^'+re.escape(anchor.group(1))+r'- id: ',src[start:])
end=start+nextpeer.start() if nextpeer else len(src)
segment=src[start:end]
if 'thresholdRatio:' in segment:
    segment=re.sub(r'(?m)^(\s*thresholdRatio:\s*)[^\n]+',r'\g<1>0.5',segment,count=1)
else:
    m=re.search(r'(?m)^(\s*)config:\s*$',segment)
    if not m:
        # The shipped standard preset relies on compact defaults. Add an
        # explicit config block immediately below the row rather than aborting.
        indent=anchor.group(1)+'  '
        segment='\n'+indent+'config:\n'+indent+'  thresholdRatio: 0.5\n'+indent+'  retainRatio: 0.16\n'+indent+'  headroomTokens: 65536\n'+indent+'  maxTokens: 65536\n'+indent+'  compactionRetries: 1\n'+indent+'  maxOverflowRetries: 1\n'+indent+'  auto: true'+segment
    else:
        indent=m.group(1)+'  '
        segment=segment[:m.end()]+'\n'+indent+'thresholdRatio: 0.5'+segment[m.end():]
src=src[:start]+segment+src[end:]
# Keep default skill roots; add bundle-local skill directory as an additional root.
anchor=re.search(r'(?m)^(\s*)- id: skill-filesystem\s*$',src)
if not anchor:sys.exit('No skill-filesystem row')
start=anchor.end(); peer=re.search(r'(?m)^'+re.escape(anchor.group(1))+r'- id: ',src[start:]); end=start+peer.start() if peer else len(src)
segment=src[start:end]
expr="!!js \"process.getBuiltinModule('node:path').join(process.getBuiltinModule('node:path').dirname(process.getBuiltinModule('node:module').createRequire(baseUrl).resolve('@local/dsh-engineering-workflow/package.json')), 'skills')\""
if 'customSkillDirs:' in segment:
    m=re.search(r'(?m)^(\s*)customSkillDirs:\s*$',segment)
    if not m:sys.exit('Unexpected customSkillDirs representation')
    segment=segment[:m.end()]+'\n'+m.group(1)+'  - '+expr+segment[m.end():]
else:
    m=re.search(r'(?m)^(\s*)config:\s*$',segment)
    if not m:
        # The shipped standard preset has no skill-filesystem config; add one
        # while keeping the default project/user roots enabled.
        indent=anchor.group(1)+'  '
        segment='\n'+indent+'config:\n'+indent+'  customSkillDirs:\n'+indent+'    - '+expr+segment
    else:
        indent=m.group(1)+'  '
        segment=segment[:m.end()]+'\n'+indent+'customSkillDirs:\n'+indent+'  - '+expr+segment[m.end():]
src=src[:start]+segment+src[end:]
# Add the optional, disabled-by-default recovery plugin without disturbing the
# standard tool list. It is inserted beside the other preset rows.
anchor=re.search(r'(?m)^(\s*)- id: agent-instructions\s*$',src)
if not anchor: sys.exit('No agent-instructions row for recovery insertion')
indent=anchor.group(1)
recovery=(
    indent+'- id: engineering-recovery\n'
    +indent+"  name: '@local/dsh-engineering-workflow/recovery'\n"
    +indent+'  config:\n'
    +indent+'    enabled: false\n'
)
src=src[:anchor.start()]+recovery+src[anchor.start():]
# Replace plain persona prefix if the preset uses standard prefix. Otherwise refuse.
if 'You are a coding agent powered by' in src:
    src=src.replace('You are a coding agent powered by the {{model}} model.',
       'You are an engineering agent powered by {{model}}. When working on a repository, invoke the engineering-workflow skill and honor project AGENTS.md.',1)
else:
    print('WARNING: Persona prefix was not changed; inspect and ensure engineering-workflow is loaded.')
(root/'cordis.patch.yml').write_text(src)
print('Generated cordis.patch.yml from',sys.argv[1]);print('Review patch, inspect resolved customSkillDirs and DSH version before install.')
