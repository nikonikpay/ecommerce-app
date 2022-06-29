import {Component, OnInit} from '@angular/core';
import {ProductService} from "../../services/product.service";
import {ProductCategory} from "../../common/product-category";

@Component({
  selector: 'app-product-category-menu',
  templateUrl: './product-category-menu.component.html',
  styleUrls: ['./product-category-menu.component.css']
})
export class ProductCategoryMenuComponent implements OnInit {

  productCategories: ProductCategory[];

  constructor(private productService: ProductService) {
  }

  ngOnInit(): void {
    this.listProductCategories();

  }

  private listProductCategories() {
    this.productService.getProductCategories().subscribe(data => {
      console.log('Product categories' + JSON.stringify(data))
      this.productCategories = data;
    })
  }
}
