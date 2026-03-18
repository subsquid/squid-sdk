const fs = require('fs')
const path = require('path')
const {execSync} = require('child_process')

const DEFAULT_BASELINE_DATE = '2026-03-01'

function exec(cmd) {
    return execSync(cmd, {encoding: 'utf8'}).trim()
}

function stripJsonComments(text) {
    return text.replace(/("(?:[^"\\]|\\.)*")|\/\*[\s\S]*?\*\/|\/\/.*/g, '$1')
}

function getRushProjects() {
    const raw = fs.readFileSync(path.resolve('rush.json'), 'utf8')
    return JSON.parse(stripJsonComments(raw)).projects
}

function findBaselineRef() {
    const tags = exec('git tag -l')
        .split('\n')
        .filter((t) => /^\d{4}-\d{2}-\d{2}(\.\d+)?$/.test(t))
        .sort()

    if (tags.length > 0) {
        const latest = tags[tags.length - 1]
        console.log(`Previous release: ${latest}`)
        return latest
    }

    const sha = exec(`git rev-list -1 --before="${DEFAULT_BASELINE_DATE}" HEAD`)
    if (sha) {
        console.log(`No previous release, using baseline: ${DEFAULT_BASELINE_DATE} (${sha.slice(0, 9)})`)
        return sha
    }

    console.log('No baseline found, using first commit')
    return exec('git rev-list --max-parents=0 HEAD')
}

function getChangedChangelogPaths(baselineRef) {
    const output = exec(`git diff --name-only ${baselineRef}..HEAD -- '**/CHANGELOG.md'`)
    if (!output) return []
    return output.split('\n').filter(Boolean)
}

function extractNewEntries(changelogPath, baselineRef) {
    const currentContent = fs.readFileSync(changelogPath, 'utf8')

    let oldFirstVersion = null
    try {
        const oldContent = exec(`git show ${baselineRef}:${changelogPath}`)
        const match = oldContent.match(/^## (\S+)/m)
        if (match) oldFirstVersion = match[1]
    } catch {
        // File didn't exist at baseline — all entries are new
    }

    const lines = currentContent.split('\n')
    const entries = []
    let current = null

    for (const line of lines) {
        if (line.startsWith('## ')) {
            const version = line.split(' ')[1]
            if (version === oldFirstVersion) break
            if (current) entries.push(current)
            current = {version, body: []}
            continue
        }
        if (current) current.body.push(line)
    }
    if (current) entries.push(current)

    return entries
        .map((e) => {
            e.body = e.body
                .filter((l) => !/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/.test(l))
                .map((l) => (l.startsWith('### ') ? '#' + l : l))
            return e
        })
        .filter((e) => {
            const meaningful = e.body
                .filter((l) => l.trim())
                .join('\n')
                .trim()
            return meaningful && meaningful !== '_Version update only_'
        })
}

function buildReleaseNotes(changedPaths, baselineRef, projectMap) {
    let notes = ''

    for (const filePath of changedPaths) {
        const dir = path.dirname(filePath)
        const pkgName = projectMap.get(dir)
        if (!pkgName) {
            console.log(`Skipping ${filePath}: not found in rush.json`)
            continue
        }

        const entries = extractNewEntries(filePath, baselineRef)
        for (const entry of entries) {
            notes += `### ${pkgName} ${entry.version}\n${entry.body.join('\n')}\n\n`
        }
    }

    return notes.trim()
}

function getContributors(baselineRef) {
    const shas = exec(
        `git log ${baselineRef}..HEAD --no-merges --format="%H %aE" -- . ":!common/changes"`
    )
    if (!shas) return []

    const emailToSha = new Map()
    for (const line of shas.split('\n')) {
        const [sha, email] = line.split(' ')
        if (!email || email.includes('[bot]') || email === 'github-actions@github.com') continue
        if (!emailToSha.has(email)) emailToSha.set(email, sha)
    }

    const logins = new Set()
    const repo = process.env.GITHUB_REPOSITORY
    for (const [email, sha] of emailToSha) {
        try {
            const login = exec(`gh api repos/${repo}/commits/${sha} --jq '.author.login'`)
            if (login) logins.add(login)
        } catch {
            console.log(`Could not resolve GitHub user for ${email}`)
        }
    }

    return [...logins].sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}))
}

function createDateTag() {
    const today = new Date().toISOString().slice(0, 10)
    let tag = today
    let n = 2
    while (true) {
        try {
            exec(`git rev-parse ${tag}`)
            tag = `${today}.${n}`
            n++
        } catch {
            return tag
        }
    }
}

function main() {
    const projects = getRushProjects()
    const projectMap = new Map(projects.map((p) => [p.projectFolder, p.packageName]))

    const baselineRef = findBaselineRef()
    const changedPaths = getChangedChangelogPaths(baselineRef)

    if (changedPaths.length === 0) {
        console.log('No CHANGELOG.md files changed since baseline')
        return
    }
    console.log(`Found ${changedPaths.length} changed CHANGELOG.md file(s)`)

    let notes = buildReleaseNotes(changedPaths, baselineRef, projectMap)

    if (!notes) {
        console.log('No meaningful changelog entries, skipping GitHub release')
        return
    }

    const contributors = getContributors(baselineRef)
    if (contributors.length > 0) {
        notes += '\n\n---\n\n### Contributors\n\n'
        notes += contributors.map((login) => `@${login}`).join(', ')
    }

    const notesFile = '/tmp/release-notes.md'
    fs.writeFileSync(notesFile, notes)

    const releaseTag = createDateTag()
    console.log(`Creating release ${releaseTag}`)

    exec(`git tag ${releaseTag}`)
    exec(`git push origin ${releaseTag}`)
    execSync(
        `gh release create ${releaseTag} --title ${releaseTag} --notes-file ${notesFile} --verify-tag`,
        {stdio: 'inherit'}
    )
}

main()
