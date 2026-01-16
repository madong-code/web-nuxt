interface setParam {
    key: string,
    data: any,
    success?: () => {},
    fail?: (err: any) => {}
}

class Storage {

    /**
     * 设置缓存
     * @param param 
     */
    public set(param: setParam) {
        try {
            window.localStorage.setItem(param.key, JSON.stringify(param.data))
            typeof param.success == 'function' && param.success()
        } catch (error) {
            typeof param.fail == 'function' && param.fail(error)
        }
    }

    /**
     * 获取缓存
     * @param key 
     * @returns 
     */
    public get(key: string) {
        try {
            const json: any = window.localStorage.getItem(key)
            return JSON.parse(json)
        } catch (error) {
            return null
        }
    }

    /**
     * 移除指定缓存
     * @param key 
     */
    public remove(key: string | string[]) {
        if (typeof key == 'string') window.localStorage.removeItem(key)
        else key.forEach(item => { window.localStorage.removeItem(item) })
    }

    /**
     * 清理缓存
     */
    public clear() {
        window.localStorage.clear()
    }
}

const storage = new Storage()
export default storage
