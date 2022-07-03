import { createApp } from 'vue'
import App from './App.vue'
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import AmplifyVue from '@aws-amplify/ui-vue';

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'
/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
/* import specific icons */
import { faTrash } from '@fortawesome/free-solid-svg-icons'

Amplify.configure(awsExports);

/* add icons to the library */
library.add(faTrash)

const app = createApp(App);
app.use(AmplifyVue);
app.mount('#app');

createApp(App).component('font-awesome-icon', FontAwesomeIcon).mount('#app')
