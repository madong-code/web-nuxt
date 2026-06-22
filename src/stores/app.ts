import { defineStore } from 'pinia'

interface App {
    route: string
}

const useAppStore = defineStore('app', {
    state: (): App => {
        return {
            route: ''
        }
    },
    actions: {

    }
})

export default useAppStore