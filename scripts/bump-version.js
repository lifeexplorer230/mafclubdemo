#!/usr/bin/env node
/**
 * Автоматическое обновление версии приложения
 *
 * Использование:
 *   node scripts/bump-version.js [major|minor|patch]
 *
 * Если тип не указан, автоматически определяется по коммиту:
 *   - feat: / feature: → minor
 *   - fix: / bugfix: → patch
 *   - breaking: / BREAKING → major
 *   - по умолчанию → patch
 */

import fs from 'fs';
import { execSync } from 'child_process';

const PACKAGE_JSON = './package.json';
const VERSION_API = './api/version.js';
const ROADMAP = './ROADMAP.md';

/**
 * Читает текущую версию из package.json
 */
function getCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
  return pkg.version;
}

/**
 * Парсит версию в компоненты
 */
function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}

/**
 * Увеличивает версию
 */
function bumpVersion(version, type) {
  const v = parseVersion(version);

  switch (type) {
    case 'major':
      v.major++;
      v.minor = 0;
      v.patch = 0;
      break;
    case 'minor':
      v.minor++;
      v.patch = 0;
      break;
    case 'patch':
    default:
      v.patch++;
      break;
  }

  return `${v.major}.${v.minor}.${v.patch}`;
}

/**
 * Определяет тип версии по последнему коммиту
 */
function detectBumpType() {
  try {
    const lastCommit = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' });
    const commitLower = lastCommit.toLowerCase();

    if (commitLower.includes('breaking') || commitLower.includes('major:')) {
      return 'major';
    }

    if (commitLower.startsWith('feat:') ||
        commitLower.startsWith('feature:') ||
        commitLower.includes('minor:')) {
      return 'minor';
    }

    // По умолчанию patch (fix, chore, docs, etc.)
    return 'patch';
  } catch (error) {
    console.warn('Cannot detect commit message, using patch');
    return 'patch';
  }
}

/**
 * Обновляет package.json
 */
function updatePackageJson(newVersion) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
  pkg.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✅ Updated package.json to v${newVersion}`);
}

/**
 * Обновляет api/version.js (fallback версия)
 */
function updateVersionApi(newVersion) {
  let content = fs.readFileSync(VERSION_API, 'utf-8');
  content = content.replace(
    /const version = process\.env\.APP_VERSION \|\| '(v[\d.]+)';/,
    `const version = process.env.APP_VERSION || 'v${newVersion}';`
  );
  fs.writeFileSync(VERSION_API, content);
  console.log(`✅ Updated api/version.js to v${newVersion}`);
}

/**
 * Получает краткое описание изменений из последнего коммита
 */
function getChangeDescription() {
  try {
    const lastCommit = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' });
    // Берём первую строку коммита
    return lastCommit.split('\n')[0].trim();
  } catch (error) {
    return 'Changes committed';
  }
}

/**
 * Добавляет запись в ROADMAP.md
 */
function updateRoadmap(oldVersion, newVersion, bumpType) {
  const roadmapPath = ROADMAP;
  let content = fs.readFileSync(roadmapPath, 'utf-8');

  const changeDesc = getChangeDescription();
  const today = new Date().toISOString().split('T')[0];

  // Формируем changelog entry
  const changelogEntry = `
### v${newVersion} (${today})
**Тип**: ${bumpType === 'major' ? 'Major' : bumpType === 'minor' ? 'Minor' : 'Patch'}
**Изменения**: ${changeDesc}

`;

  // Ищем секцию CHANGELOG
  const changelogMarker = '## CHANGELOG';
  const changelogIndex = content.indexOf(changelogMarker);

  if (changelogIndex === -1) {
    // Если секции нет, добавляем в конец
    content += '\n\n## CHANGELOG\n' + changelogEntry;
  } else {
    // Вставляем после маркера CHANGELOG
    const insertIndex = changelogIndex + changelogMarker.length + 1;
    content = content.slice(0, insertIndex) + '\n' + changelogEntry + content.slice(insertIndex);
  }

  fs.writeFileSync(roadmapPath, content);
  console.log(`✅ Updated ROADMAP.md with v${newVersion} changelog`);
}

/**
 * Главная функция
 */
function main() {
  const args = process.argv.slice(2);
  const bumpType = args[0] || detectBumpType();

  const currentVersion = getCurrentVersion();
  const newVersion = bumpVersion(currentVersion, bumpType);

  console.log(`\n🔧 Bumping version from v${currentVersion} to v${newVersion} (${bumpType})\n`);

  // Обновляем файлы
  updatePackageJson(newVersion);
  updateVersionApi(newVersion);
  updateRoadmap(currentVersion, newVersion, bumpType);

  console.log(`\n✅ Version bumped successfully!\n`);
  console.log(`📝 Next steps:`);
  console.log(`   1. Review changes: git diff`);
  console.log(`   2. Commit: git add -A && git commit --amend --no-edit`);
  console.log(`   3. Tag: git tag v${newVersion}`);
  console.log(`   4. Push: git push && git push --tags\n`);
}

main();
