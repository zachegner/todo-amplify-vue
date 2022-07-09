<script>
import { API } from "aws-amplify";
import { createTodo, deleteTodo, updateTodo } from "./graphql/mutations";
import { listTodos } from "./graphql/queries";
import { onCreateTodo, onUpdateTodo } from "./graphql/subscriptions";
import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";

export default {
  name: "app",
  components: {
    Authenticator,
  },
  async created() {
    this.getTodos();
    this.subscribe(onCreateTodo);
  },
  async updated() {
    this.getTodos();
    this.subscribe(onUpdateTodo);
  },
  data() {
    return {
      name: "",
      description: "",
      todos: [],
      isModalVisible: false,
    };
  },
  methods: {
    showModalValues(id, name, description) {
      this.name = name;
      this.description = description;
      this.id = id;
    },
    clearValues() {
      this.name = "";
      this.description = "";
    },
    async createTodo() {
      const date = new Date().toLocaleString();
      const { name, description } = this;
      if (!name || !description) return;
      const todo = { name, description, date };
      await API.graphql({
        query: createTodo,
        variables: { input: todo },
      });
      this.name = "";
      this.description = "";
    },
    async getTodos() {
      const todos = await API.graphql({
        query: listTodos,
      });
      this.todos = todos.data.listTodos.items;
    },
    async updateTodo(todoId, todoName, todoDesc) {
      const date = new Date().toLocaleString()
      await API.graphql({
        query: updateTodo,
        variables: {
          input: {
            id: todoId,
            name: todoName,
            description: todoDesc,
            date: date
          },
        },
      });
      this.clearValues()
    },
    async deleteTodo(todoId) {
      const newTodosArray = this.todos.filter((todo) => todo.id !== todoId);
      this.todos = newTodosArray;
      await API.graphql({
        query: deleteTodo,
        variables: { input: { id: todoId } },
      });
    },
    subscribe() {
      API.graphql({
        query: onCreateTodo,
      }).subscribe({
        next: (eventData) => {
          let todo = eventData.value.data.onCreateTodo;
          console.log(todo)
          //if (this.todos.some((item) => item.name === todo.name)) return; // remove duplications
          this.todos = [...this.todos, todo];
        },
        error: (error) => console.warn(error),
      });
      API.graphql({
        query: onUpdateTodo,
        variables: { id: this.id },
      }).subscribe({
        next: (eventData) => {
          let newTodo = eventData.value.data.onUpdateTodo;
          let oldTodoIndex = this.todos.findIndex(
            (item) => item.id === newTodo.id
          );
          this.todos[oldTodoIndex] = newTodo;
        },
      });
    },
  },
};
</script>

<template>
  <div id="app">
    <authenticator>
      <template v-slot="{ user, signOut }">
        <nav class="navbar bg-light mb-2 sticky-top">
          <div class="container-fluid">
            <span class="navbar-brand mb-0 h1"><h1>Todo App</h1></span>
            <button class="btn btn-dark" @click="signOut">Sign Out</button>
          </div>
        </nav>

        <h3 class="ms-3">Hello {{ user.username }}!</h3>
        <div @keyup.enter="createTodo" class="container w-75">
          <div class="input-group mb-2">
            <span class="input-group-text" id="basic-addon1">Todo</span>
            <input
              v-model="name"
              type="text"
              class="form-control"
              aria-label="Todo Name"
            />
          </div>
          <div class="input-group mb-2">
            <span class="input-group-text">Description</span>
            <textarea
              v-model="description"
              class="form-control"
              aria-label="Description"
            ></textarea>
          </div>
          <button class="btn btn-success mb-2" @click="createTodo">
            Create
          </button>
        </div>

        <hr />

        <div class="container mt-4 mb-3 w-50">
          <div class="card mb-2 g-col-4" v-for="item in todos" :key="item.id">
            <div class="card-body">
              <h3 class="card-title">{{ item.name }}</h3>
              <p class="card-text">{{ item.description }}</p>
              <p class="card-text">{{ item.date }}</p>
            </div>
            <div class="btn-group mb-3 mx-3" role="group">
              <button class="btn btn-danger" @click="deleteTodo(item.id)">
                <i class="bi bi-trash-fill"> Delete</i>
              </button>
              <button
                data-bs-toggle="modal"
                data-bs-target="#staticBackdrop"
                class="btn btn-primary"
                
                @click="clearValues;showModalValues(item.id, item.name, item.description)"
              >
                <i class="bi bi-pencil-square"> Edit</i>
              </button>
            </div>
          </div>
        </div>

        <!-- Modal -->
        <div
          class="modal fade"
          id="staticBackdrop"
          data-bs-backdrop="static"
          data-bs-keyboard="false"
          tabindex="-1"
          aria-labelledby="staticBackdropLabel"
          aria-hidden="true"
        >
          <div class="modal-dialog modal-xl">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="staticBackdropLabel">
                  Update Todo
                </h5>
                <button
                  type="button"
                  class="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  @click="clearValues"
                ></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label for="exampleFormControlInput1" class="form-label"
                    >Todo</label
                  >
                  <input
                    type="text"
                    class="form-control"
                    id="exampleFormControlInput1"
                    placeholder="Todo name"
                    v-model="this.name"
                  />
                </div>
                <div class="mb-3">
                  <label for="exampleFormControlTextarea1" class="form-label"
                    >Description</label
                  >
                  <textarea
                    class="form-control"
                    id="exampleFormControlTextarea1"
                    rows="3"
                    v-model="this.description"
                  ></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  data-bs-dismiss="modal"
                  @click="clearValues"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  data-bs-dismiss="modal"
                  @click="updateTodo(this.id, this.name, this.description)"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </authenticator>
  </div>
</template>

<style></style>
