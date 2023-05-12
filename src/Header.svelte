<script>
    export let title = '';
  </script>
  
  <header>
    <div class="left">
      <h1>{title}</h1>
    </div>
    <div class="right">
        <slot></slot>
  </header>
  
  <style>
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background-color: #f0f0f0;
    }
  
    .left {
      flex-grow: 1;
    }
  
    .right {
      display: flex;
      gap: 10px;
    }
  </style>
  