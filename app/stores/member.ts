
import { defineStore } from 'pinia'
import {  MEMBER_KEY } from './constant/keys'
import { getMemberProfile } from '~/api/member'


interface Member {
    token: string | null
    info: Record<string, any> | null,
    loginPopup:boolean
}


const info={
"id": 1001,
"username": "john_doe",
"nickname": "John",
"email": "john.doe@example.com",
"mobile": "13800138000",
"gender": 1,
"birthday": "1990-05-15",
"money": 1500.5,
"score": 2500,
"avatar": "",
"last_login_time": "2024-05-20T14:30:00Z",
"last_login_ip": "192.168.1.100",
"motto": "Stay curious, keep learning",
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDAxIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
"refresh_token": "rt_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
}


export const useMemberStore = defineStore('member', {
    state: (): Member => {
        return {
            token: useCookie('token').value||'',
            info: info,
            loginPopup:false
        }
    },
    actions: {
       async setToken(token: string) {
            this.token = token
            useCookie('token').value = token
            await this.getMemberInfo()
        },
        async getMemberInfo() {
            if (!this.token) return
            await getMemberProfile()
                .then((res: any) => {
                    this.info = res.data
                })
                .catch((err) => {
                    this.logout()
                })
        },
        logout() {
            if (!this.token) return
            this.token = ''
            this.info = null
            useCookie('token').value = null
            // logout().then().catch()
        },
        logOpen(){
            this.loginPopup = true
        },
        logClose(){
            this.loginPopup = false
        }
    }
})
