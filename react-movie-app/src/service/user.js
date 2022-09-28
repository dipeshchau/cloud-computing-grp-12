export const getLoggedInUser = () => {
    const user = localStorage.getItem("user")
    return JSON.parse(user)
}

export const setLoggedInUser = (user) => {
    const stringifiedUser = JSON.stringify(user)
    localStorage.setItem("user", stringifiedUser)
}

export const logout = () => {

    localStorage.removeItem("user")
}