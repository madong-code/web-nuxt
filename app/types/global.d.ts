declare interface AnyObject {
    [key: string]: any;
}

declare interface responseResult {
    code: number,
    data: any,
    msg: string
}

interface requestMobileParam {
    mobile: string,
    captcha_code: string,
    captcha_key: string,
    type: string
}


