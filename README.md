# Week 2 Assignment

What I have done:

-   Implement the guess game, pass all the test cases listed in the assignment document.
-   Implement the first addional tasks so that the Host can specify the number of Players upon deployment.
-   Write unit test cases in `test/` folder.
-   Answer the questions of Additional Tasks as below

**Question: Explain the reason of having both nonceHash and nonceNumHash in the smart contract. Can any of these two be omitted and why?**

Answer: These two Hash keep the Host honestly reveal with the same nonce/number as the value set in deployment. Both two are required, if the `nonceHash` is omitted, the Host can reveal with different nonce & number but keeps the same `nonceNumHash`. For example, the Host deployed with `nonce=222, number=11`, but reveal with `nonce=22, number=211`, because the concated string of nonce and number is not changed, so the `nonceNumHash` will not be changed. It's even worse if `nonceNumHash` is omitted, because there is no number infomation any more.

**Question: Try to find out any security loopholes in the above design and propose an improved solution.**

Answer: Attacker could use a lot of addresses to occupy all the limited players, thus win the ether deposited by the host. The solution: the Host doesn't deposit ether, but just pass the value as a constructor parameter.
