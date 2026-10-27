/**
 * 实体化 .output/server/node_modules 中的 junction/symlink（构建后必须执行）。
 *
 * 背景：Nitro 依赖追踪对多版本去重的包（如 hookable/entities/lodash-es/lucide-vue-next）
 * 在 Windows 上以 NTFS Junction 写入产物。Junction 是 Windows 专有对象，
 * zip/目录上传到 Linux 后失效，导致生产 SSR 报 ERR_MODULE_NOT_FOUND（Cannot find package 'hookable'）。
 *
 * 本脚本将所有链接替换为其真实目标目录的拷贝，使产物与传输方式解耦：
 *   node scripts/materialize-output.mjs
 */
import { cp, lstat, readdir, readlink, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const roots = ['.output/server/node_modules']

let replaced = 0

async function walk(dir) {
    for (const name of await readdir(dir)) {
        const p = join(dir, name)
        const st = await lstat(p)
        if (st.isSymbolicLink()) {
            const target = resolve(dir, await readlink(p))
            await rm(p, { recursive: true })
            await cp(target, p, { recursive: true })
            replaced++
            console.log(`[materialize] ${p} <= ${target}`)
        } else if (st.isDirectory()) {
            await walk(p)
        }
    }
}

for (const root of roots) {
    try {
        await walk(root)
    } catch (e) {
        if (e.code !== 'ENOENT') throw e
        console.warn(`[materialize] skip missing ${root}`)
    }
}

console.log(`[materialize] done, ${replaced} link(s) replaced`)
