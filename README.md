# CodeForces Contest Reminder WhatsApp Bot 🤖

This is a simple WhatsApp bot built using the `whatsapp-web.js` library. The bot provides various features and commands to interact with it. To chat with the bot🤖 click [here](https://wa.me/919455789099?text=.help) 💬

## Features 🚀

✅ Get contest performance of all users present in the group. Users can be added or removed from the group. 📊

✅ Get a list and ratings of all users present in the group. 📋

✅ Configure different reminder time and frequency for each group. ⏰

✅ Group admins can use group-specific commands like `.interval` and `.reminder`. 👥

✅ Tag users to promote or demote them instead of using mobile numbers. 🔖

## Available Commands 💻

This bot provides the following commands: 📢

- `.help`: Displays the help message.
- `.contest`: Sends a list of upcoming CodeForces contests.
- `.about`: Displays information about the bot.
- `.enable`: Enables CodeForces contests reminder for the group.
- `.disable`: Disables CodeForces contests reminder for the group.
- `.interval MINUTES` or `.frequency MINUTES`: Sets the time interval in minutes between two consecutive reminders.
- `.reminder HOURS`: Sets the time in hours before which the bot will start sending reminders.
- `.adduser handle1 handle2 ...` or `.add handle1 handle2 ...`: Adds CodeForces handles to the list.
- `.deleteuser handle1 handle2 ...` or `.delete handle1 handle2 ...` or `.remove handle1 handle2 ...` or `.removeuser handle1 handle2 ...`: Removes CodeForces handles from the list.
- `.listusers` or `.list`: Sends a list of all handles in the group.
- `.performance CONTEST_ID` or `.perf CONTEST_ID`: Sends the performance of all users in the specified contest.
- `.ratings`: Sends the ratings of all users in the group.
- `.addmem 98765XXXXX 98765XXXXX 98765XXXXX` or `.addmember 98765XXXXX 98765XXXXX 98765XXXXX` or `.addmembers 98765XXXXX 98765XXXXX 98765XXXXX`: Adds new users to the group. User contact must be saved by the bot, and the bot must be an admin.
- `.promote @user`: Adds a user to the bot admin list of bot commands.
- `.demote @user`: Removes a user from the bot admin list of bot commands.
- `.join InviteLink`: Joins the group using the invite link.
- `.broadcast Message_to_send`: Sends a message to all the groups in which the bot is added.
- `.reset CONFIRM`: Resets the bot to default configurations for the group. By default, the bot is disabled for a group.

Feel free to customize or enhance the bot as per your requirements! 🔧

## Installation 💻

To install the required dependencies, run the following command:

```sh
npm install whatsapp-web.js qrcode-terminal
```


## Getting Started 🚀
1. Clone this repository.
2. Install the dependencies mentioned above.
3. Run the bot using the following command:

```sh
node index.js
```

Now, you're ready to use the WhatsApp bot! Enjoy the seamless experience of managing contests and users in your group. 🎉


## Acknowledgements

This project wouldn't have been possible without the invaluable contribution of the `whatsapp-web.js` library. I would like to express my sincere gratitude to the developers of `whatsapp-web.js` for providing a powerful and reliable library for building WhatsApp bots.

Special thanks to the team behind `whatsapp-web.js` for their continuous efforts in maintaining and improving the library, as well as the open-source community for their support and contributions.

Repository Link: [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)

Thank you once again to the developers of `whatsapp-web.js` for their exceptional work!


## License

This project is licensed under the [MIT License](LICENSE).


## Closing Remarks

Thank you for checking out this WhatsApp Bot repository! I hope you find it useful and informative. Feel free to explore the code, customize it according to your needs, and contribute to its development.

If you have any questions, suggestions, or issues, please don't hesitate to open an issue or submit a pull request. Your feedback and contributions are greatly appreciated.

Happy coding and enjoy using the WhatsApp Bot! 🚀
