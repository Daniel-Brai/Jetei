htmx.defineExtension('load-templates', {
  transformResponse: function (text, xhr, elt) {
    var nunjucksTemplate = htmx.closest(elt, '[nunjucks-template]');
    if (nunjucksTemplate) {
      var data = JSON.parse(text);
      var templateName = nunjucksTemplate.getAttribute('nunjucks-template');
      var template = htmx.find('#' + templateName);
      template.innerHTML = `
<form 
  id="update-profile-form"
  class="mb-24 px-4 sm:px-8" 
>
    <div>
      <div class="pb-12">
        <h2 class="text-lg font-semibold leading-7">Profile</h2>
        <p class="mt-1 text-sm leading-6">
          This information will be displayed publicly so be careful what you
          share.
        </p>

        <div class="mt-5">
          <div class="mt-5">
            <label
              for="name"
              class="block text-sm font-medium leading-6 mb-2"
              >Name</label
            >
            <div class="mt-2 w-full sm:w-[60%]">
                <input
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-white file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    type="text"
                    id="name"
                    name="name"
                    minlength="2"
                    value="{{ data.profile.name }}"
                />
            </div>
          </div>

          <div class="mt-5">
            <label
              for="bio"
              class="block text-sm font-medium leading-6 mb-2"
              >Bio</label
            >
            <div class="mt-2">
                <input
                    id="bio"
                    type="text"
                    name="bio"
                    style="resize: none; overflow: hidden;"
                    class="border flex transition-all w-full rounded-md bg-transparent px-3 py-7 text-[14px] shadow-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    value="{{ data.profile.bio }}"
                  />
            </div>
            <p class="mt-3 text-sm leading-6 text-gray-600">
              Write a few sentences about yourself.
            </p>
          </div>

          <div class="mt-5">
            <div
              class="block text-sm font-medium leading-6"
              >Photo</div
            >
            <div class="mt-2 flex items-center gap-x-3">
              {% if data.profile.avatar %}
                <img id="avatarImg" src="{{ data.profile.avatar }}" class="h-12 w-12" />
              {% else %}
              <div class="w-8 h-8"> 
                <svg
                  class="size-9"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div> 
              {% endif %}
              <div class="ml-2 flex text-sm leading-6 text-white">
                  <label
                    for="avatar"
                    class="relative cursor-pointer rounded-md btn-outline font-semibold focus-within:outline-none py-2 px-2"
                  >
                    <span>Upload a photo</span>
                    <input
                      id="avatar"
                      name="avatar"
                      type="file"
                      class="sr-only hidden"
                    />
                  </label>
                  <button id="upload-avatar" class="hidden" type="button">Upload</button>
                  <input id="avatar-url" class="hidden" value="" />
                </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <div class="mt-6 border-t pt-5">
        <h2 class="text-lg font-semibold leading-7">
          Personal Information
        </h2>
        <p class="mt-1 text-sm leading-6">
          Use a permanent address where you can receive mail.
        </p>

        <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div class="mt-4">
            <label
              for="email"
              class="block text-sm font-medium leading-6 mb-2"
              >Email address</label
            >
            <div class="">
                <input
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-white file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    type="email"
                    id="email"
                    name="email"
                    minlength="2"
                    value="{{ data.email }}"
                />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 border-t pt-5 pb-12">
        <h2 class="text-lg font-semibold leading-7">
          Change Account Password
        </h2>
        <p class="mt-1 text-sm leading-6">
          Update your password by filling the form below
        </p>  

        <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div class="mt-4">
            <label
              for="new_password"
              class="block text-sm font-medium leading-6 mb-2"
              >Password</label
            >
            <div class="mt-2">
                <input
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-white file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    type="password"
                    id="new_password"
                    name="new_password"
                    minlength="8"
                />
            </div>
          </div>
          <div class="mt-4">
            <label
              for="new_password"
              class="block text-sm font-medium leading-6 mb-2"
              >Password Confirm</label
            >
            <div class="mt-2">
                <input
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-white file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    type="password"
                    id="new_password_confirm"
                    name="new_password_confirm"
                    minlength="8"
                />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-6 flex items-center justify-end space-x-3">
        <button
            id="cancel-btn"
            type="button"
            name="cancel"
            class="btn-ghost btn-base-size text-sm rounded-md flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
            >
            Cancel
        </button>
        <button
            id="save-btn"
            type="button"
            name="save"
            class="btn-base-variant btn-base-size text-sm rounded-md flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
            data-loading-disable
            >
            Save
        </button>
      </div>
    </div>
</form> 
<div id="message-container" class="ml-2 mx-auto mb-4 hidden max-w-fit items-start btn-outline rounded-md px-4 py-3">
  <div class="text-sm" id="message-renderer"></div>
</div>
<script nonce>
const updateProfileForm = document.getElementById('update-profile-form');
const submitButton = document.getElementById('save-btn');
const cancelButton = document.getElementById('cancel-btn');
const avatarImg = document.getElementById('avatarImg')
const avatar = document.getElementById('avatar')
const email = document.getElementById('email')
const name = document.getElementById('name')
const bio = document.getElementById('bio')
const password = document.getElementById('new_password') 
const password_confirm = document.getElementById('new_password_confirm') 
const submitAvatarButton = document.getElementById('upload-avatar');
const avatarLink = document.getElementById('avatar-url');
const toastContainer = document.getElementById('message-container')
const toastMessage = document.getElementById('message-renderer')

console.log(avatarLink)

cancelButton.addEventListener('click', () => {
  updateProfileForm.reset()
})


if (avatar) {
    avatar.addEventListener('change', () => {
      if (avatar.files.length > 0) {
          submitAvatarButton.click();
      }
    });
}


submitAvatarButton.addEventListener('click', async () => {
    const file = avatar.files[0];

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(
            "/api/v1/hubs/unknown/upload-file",
            {
                method: 'POST',
                body: formData,
            },
        );
        const data = await res.json();
        avatarLink.setAttribute('value', data.url)
        console.log(data)
    } catch (e) {
        console.log(e);
    }
});

submitButton.addEventListener('click', async () => {
    console.log('clicked')
    let file = avatar.files > 0 ? avatar.files[0] : null;
    let emailValue = email.value ? email.value.trim() : null;
    let nameValue = name.value ? name.value.trim() : null;
    let pValue =  password.value ? password.value.trim() : null;
    let pcValue = password_confirm.value ? password_confirm.value.trim() : null;
    let bioValue = bio.value ? bio.value.trim() : null;
    let avatarValue = document.getElementById('avatar-url') ? document.getElementById('avatar-url').value : null

    console.log(file, emailValue, nameValue, bioValue, pcValue, pValue, avatarValue)

    try {
        const res = await fetch(
          "/api/v1/authentication/me",
          {
            method: 'PUT',
            body: JSON.stringify({
              email: emailValue,
              name: nameValue,
              bio: bioValue,
              avatar: avatarValue,
              new_password: pValue,
              new_password_confirm: pcValue,
            })
          },
        );
      
        const data = await res.json()

        if (data.type === 'success') {
          updateProfileForm.reset()
          toastContainer.classList.remove('hidden')
          toastMessage.textContent = "Saved successfully"; 
          setTimeout(() => {
            toastContainer.classList.add('hidden')
          }, 3000)
          name.value = data.profile.name;
          bio.value = data.profile.bio
          email.value = data.email
        } else if (data.type === 'error') {
          updateProfileForm.reset()
          toastContainer.classList.remove('hidden')
          toastMessage.textContent = "Failed to save"; 
          setTimeout(() => {
            toastContainer.classList.add('hidden')
          }, 3000)
        } 

    } catch (e) {
        console.log(e);
    }
})
</script>

            
            `
      if (template) {
        return nunjucks.renderString(template.innerHTML, data);
      } else {
        return nunjucks.render(templateName, data);
      }
    }
  },
});
