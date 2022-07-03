<script>
import { API } from 'aws-amplify';
import { createTodo, deleteTodo } from './graphql/mutations';
import { listTodos } from './graphql/queries';
import { onCreateTodo } from './graphql/subscriptions';
import { Authenticator } from '@aws-amplify/ui-vue';
import '@aws-amplify/ui-vue/styles.css';

export default {
  name: 'app',
  components: {
    Authenticator,
  },
  async created() {
    this.getTodos();
    this.subscribe();
  },
  data() {
    return {
      name: '',
      description: '',
      todos: []
    }
  },
  methods: {
    async createTodo() {
      const { name, description } = this;
      if (!name || !description) return;
      const todo = { name, description };
      await API.graphql({
        query: createTodo,
        variables: { input: todo },
      });
      this.name = '';
      this.description = '';
    },
    async getTodos() {
      const todos = await API.graphql({
        query: listTodos
      });
      this.todos = todos.data.listTodos.items;
    },
    async deleteTodo() {
      const { id } = this;
      const todo = { id }
      await API.graphql({
        query: deleteTodo,
        variables: { input: todo }
      })
    },
    subscribe() {
      API.graphql({ query: onCreateTodo })
        .subscribe({
          next: (eventData) => {
            let todo = eventData.value.data.onCreateTodo;
            if (this.todos.some(item => item.name === todo.name)) return; // remove duplications
            this.todos = [...this.todos, todo];
          }
        });
    }
  }
};
</script>

<template>
  <div id="app">
    <authenticator>
      <template v-slot="{ user, signOut }">
        <h1>Hello {{ user.username }}!</h1>
        <h1>Todo App</h1>
        <div class="todo-input">
          <input type="text" v-model="name" placeholder="Todo name">
          <input type="text" v-model="description" placeholder="Todo description">
          <button class="btn" @click="createTodo">Create Todo</button>
        </div>
        <div class="todo-card-container">
          <div class="todo-card" v-for="item in todos" :key="item.id">
            <div class="todo-card-info">
              <h3>{{ item.name }}</h3>
              <p>{{ item.description }}</p>
            </div>
            <font-awesome-icon class="trash-icon" icon="fa-solid fa-trash" @click="deleteTodo" />
          </div>
        </div>
        <button class="btn" @click="signOut">Sign Out</button>
      </template>
    </authenticator>
  </div>
</template>

<style>
#app {
  margin-left: 10px;
}

.todo-input {
  display: flex;
  gap: 5px;
}

.todo-card-container {
  margin-top: 20px;
  display: grid;
  max-width: 60%;
  grid-template-columns: 1fr 1fr 1fr 1fr;
}

.todo-card {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border: 1px outset rgba(0, 0, 0, .1);
  max-width: 200px;
  min-width: 150px;
  margin-bottom: 10px;
  border-radius: 5px;
  background-color: rgba(0, 0, 0, .05);
}

.todo-card:hover {
  transform: scale(1.1);
    background-color: rgba(0, 0, 0, .1);
    border: 1px outset rgba(0, 0, 0, .15);
}

.trash-icon {
  margin: auto 0;
}

.trash-icon:hover {
  color: red
}

.trash-icon:active {
  transform: scale(1.1);
}

.btn {
  width: 100px;
}
</style>
